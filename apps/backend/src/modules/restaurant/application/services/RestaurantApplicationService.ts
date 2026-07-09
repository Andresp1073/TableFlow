import type { AuthorizationService } from "../../../authorization/application/services/AuthorizationService.js";
import type { AuthorizationContext } from "../../../authorization/domain/models/AuthorizationContext.js";
import { EventBus } from "../../../../events/EventBus.js";
import type { RestaurantRepository } from "../../domain/repositories/RestaurantRepository.js";
import type { RestaurantQueryRepository } from "../../domain/repositories/RestaurantQueryRepository.js";
import type { RestaurantFactory } from "../../domain/repositories/RestaurantFactory.js";
import { RestaurantName } from "../../domain/models/RestaurantName.js";
import { RestaurantSlug } from "../../domain/models/RestaurantSlug.js";
import { RestaurantEmail } from "../../domain/models/RestaurantEmail.js";
import { RestaurantTaxId } from "../../domain/models/RestaurantTaxId.js";
import { RestaurantPhone } from "../../domain/models/RestaurantPhone.js";
import { RestaurantTimezone } from "../../domain/models/RestaurantTimezone.js";
import { RestaurantCurrency } from "../../domain/models/RestaurantCurrency.js";
import { RestaurantLanguage } from "../../domain/models/RestaurantLanguage.js";
import { RestaurantStatus } from "../../domain/models/RestaurantStatus.js";
import type { Restaurant } from "../../domain/models/Restaurant.js";
import { RestaurantUniquenessValidator } from "../../domain/services/RestaurantUniquenessValidator.js";
import { RestaurantStatusPolicy } from "../../domain/rules/RestaurantStatusPolicy.js";
import { RestaurantCreated } from "../../domain/events/RestaurantCreated.js";
import { RestaurantActivated } from "../../domain/events/RestaurantActivated.js";
import { RestaurantSuspended } from "../../domain/events/RestaurantSuspended.js";
import { RestaurantArchived } from "../../domain/events/RestaurantArchived.js";
import { RestaurantNotFoundError } from "../../errors/RestaurantNotFoundError.js";
import { RestaurantMapper } from "../mappers/RestaurantMapper.js";
import { CreateRestaurantValidator } from "../validators/CreateRestaurantValidator.js";
import { UpdateRestaurantValidator } from "../validators/UpdateRestaurantValidator.js";
import { StatusTransitionValidator } from "../validators/StatusTransitionValidator.js";
import type { RestaurantDTO } from "../dtos/RestaurantDTO.js";
import type { RestaurantListDTO } from "../dtos/RestaurantListDTO.js";
import type { CreateRestaurantCommand } from "../commands/CreateRestaurantCommand.js";
import type { UpdateRestaurantCommand } from "../commands/UpdateRestaurantCommand.js";
import type { ArchiveRestaurantCommand } from "../commands/ArchiveRestaurantCommand.js";
import type { ActivateRestaurantCommand } from "../commands/ActivateRestaurantCommand.js";
import type { SuspendRestaurantCommand } from "../commands/SuspendRestaurantCommand.js";
import type { ListRestaurantsQuery } from "../queries/ListRestaurantsQuery.js";
import type { ListRestaurantsFilters } from "../../infrastructure/repositories/PrismaRestaurantQueryRepository.js";
import { PrismaRestaurantQueryRepository } from "../../infrastructure/repositories/PrismaRestaurantQueryRepository.js";
import type { ValidationError } from "../../domain/validation/RestaurantRules.js";
import { ValidationError as AppValidationError } from "../../../../errors/ValidationError.js";

type RestaurantPermission =
  | "restaurants.create"
  | "restaurants.read"
  | "restaurants.update"
  | "restaurants.archive"
  | "restaurants.activate"
  | "restaurants.suspend";

export interface UseCaseResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export class RestaurantApplicationService {
  constructor(
    private readonly repository: RestaurantRepository,
    private readonly queryRepository: RestaurantQueryRepository,
    private readonly prismaQueryRepository: PrismaRestaurantQueryRepository,
    private readonly factory: RestaurantFactory,
    private readonly uniquenessValidator: RestaurantUniquenessValidator,
    private readonly statusPolicy: RestaurantStatusPolicy,
    private readonly authorizationService: AuthorizationService,
    private readonly eventBus: EventBus,
    private readonly createValidator: CreateRestaurantValidator = new CreateRestaurantValidator(),
    private readonly updateValidator: UpdateRestaurantValidator = new UpdateRestaurantValidator(),
    private readonly transitionValidator: StatusTransitionValidator = new StatusTransitionValidator(),
  ) {}

  private async authorize(auth: AuthorizationContext, permission: RestaurantPermission): Promise<void> {
    await this.authorizationService.authorize(auth, permission);
  }

  async create(command: CreateRestaurantCommand, auth: AuthorizationContext): Promise<RestaurantDTO> {
    await this.authorize(auth, "restaurants.create");

    const validationErrors = this.createValidator.validate(command);

    if (validationErrors.length > 0) {
      throw new AppValidationError("Validation failed", this.toErrorDetails(validationErrors));
    }

    const name = RestaurantName.create(command.name);
    const slug = RestaurantSlug.create(command.slug);

    await this.uniquenessValidator.assertSlugUnique(slug);

    if (command.email) {
      await this.uniquenessValidator.assertEmailUnique(RestaurantEmail.create(command.email));
    }

    if (command.taxId) {
      await this.uniquenessValidator.assertTaxIdUnique(RestaurantTaxId.create(command.taxId));
    }

    const timezone = command.timezone ? RestaurantTimezone.create(command.timezone) : RestaurantTimezone.create("UTC");
    const currency = command.currency ? RestaurantCurrency.create(command.currency) : RestaurantCurrency.defaultUSD();
    const language = command.language ? RestaurantLanguage.create(command.language) : RestaurantLanguage.defaultEN();

    const restaurant = this.factory.create({
      name,
      slug,
      timezone,
      currency,
      language,
      legalName: command.legalName,
      taxId: command.taxId,
      email: command.email,
      phone: command.phone,
      website: command.website,
      logoUrl: command.logoUrl,
      address: command.address,
    });

    const saved = await this.repository.save(restaurant);

    await this.eventBus.emit(
      "RestaurantCreated",
      new RestaurantCreated(saved.id, saved.name.value, saved.slug.value),
    );

    return RestaurantMapper.toDTO(saved);
  }

  async getById(query: { id: string }, auth: AuthorizationContext): Promise<RestaurantDTO> {
    await this.authorize(auth, "restaurants.read");

    const restaurant = await this.repository.findById(query.id);

    if (!restaurant) {
      throw new RestaurantNotFoundError(query.id);
    }

    return RestaurantMapper.toDTO(restaurant);
  }

  async list(query: ListRestaurantsQuery, auth: AuthorizationContext): Promise<RestaurantListDTO> {
    await this.authorize(auth, "restaurants.read");

    const filters: ListRestaurantsFilters = {
      page: query.page,
      limit: query.limit,
      status: query.status,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };

    const result = await this.prismaQueryRepository.list(filters);

    return {
      data: result.data.map(RestaurantMapper.toDTO),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async update(command: UpdateRestaurantCommand, auth: AuthorizationContext): Promise<RestaurantDTO> {
    await this.authorize(auth, "restaurants.update");

    const validationErrors = this.updateValidator.validate(command);

    if (validationErrors.length > 0) {
      throw new AppValidationError("Validation failed", this.toErrorDetails(validationErrors));
    }

    const existing = await this.repository.findById(command.id);

    if (!existing) {
      throw new RestaurantNotFoundError(command.id);
    }

    this.statusPolicy.assertNotArchived(existing.status);

    const name = command.name !== undefined ? RestaurantName.create(command.name) : existing.name;
    const slug = command.slug !== undefined ? RestaurantSlug.create(command.slug) : existing.slug;

    if (command.slug !== undefined && command.slug !== existing.slug.value) {
      await this.uniquenessValidator.assertSlugUnique(slug, command.id);
    }

    if (command.email !== undefined && command.email !== existing.email?.value) {
      await this.uniquenessValidator.assertEmailUnique(RestaurantEmail.create(command.email), command.id);
    }

    if (command.taxId !== undefined && command.taxId !== existing.taxId?.value) {
      await this.uniquenessValidator.assertTaxIdUnique(RestaurantTaxId.create(command.taxId), command.id);
    }

    const timezone = command.timezone ? RestaurantTimezone.create(command.timezone) : existing.timezone;
    const currency = command.currency ? RestaurantCurrency.create(command.currency) : existing.currency;
    const language = command.language ? RestaurantLanguage.create(command.language) : existing.language;

    const updated: Restaurant = {
      ...existing,
      name,
      slug,
      legalName: command.legalName !== undefined ? command.legalName : existing.legalName,
      taxId: command.taxId !== undefined ? RestaurantTaxId.reconstitute(command.taxId) : existing.taxId,
      email: command.email !== undefined ? RestaurantEmail.reconstitute(command.email) : existing.email,
      phone: command.phone !== undefined ? RestaurantPhone.reconstitute(command.phone) : existing.phone,
      website: command.website !== undefined ? command.website : existing.website,
      logoUrl: command.logoUrl !== undefined ? command.logoUrl : existing.logoUrl,
      address: command.address !== undefined ? command.address : existing.address,
      timezone,
      currency,
      language,
      updatedAt: new Date(),
    };

    const saved = await this.repository.update(updated);

    return RestaurantMapper.toDTO(saved);
  }

  async archive(command: ArchiveRestaurantCommand, auth: AuthorizationContext): Promise<RestaurantDTO> {
    await this.authorize(auth, "restaurants.archive");

    const existing = await this.repository.findById(command.id);

    if (!existing) {
      throw new RestaurantNotFoundError(command.id);
    }

    this.statusPolicy.assertCanArchive(existing.status);

    const previousStatus = existing.status.value;
    const archived: Restaurant = {
      ...existing,
      status: RestaurantStatus.archived(),
      deletedAt: new Date(),
      deletedBy: command.deletedBy,
      updatedAt: new Date(),
    };

    const saved = await this.repository.update(archived);
    await this.repository.softDelete(command.id);

    await this.eventBus.emit(
      "RestaurantArchived",
      new RestaurantArchived(saved.id, previousStatus, command.deletedBy),
    );

    return RestaurantMapper.toDTO(saved);
  }

  async activate(command: ActivateRestaurantCommand, auth: AuthorizationContext): Promise<RestaurantDTO> {
    await this.authorize(auth, "restaurants.activate");

    const existing = await this.repository.findById(command.id);

    if (!existing) {
      throw new RestaurantNotFoundError(command.id);
    }

    this.statusPolicy.assertCanActivate(existing.status);

    const previousStatus = existing.status.value;
    const activated: Restaurant = {
      ...existing,
      status: RestaurantStatus.active(),
      updatedAt: new Date(),
    };

    const saved = await this.repository.update(activated);

    await this.eventBus.emit(
      "RestaurantActivated",
      new RestaurantActivated(saved.id, previousStatus),
    );

    return RestaurantMapper.toDTO(saved);
  }

  async suspend(command: SuspendRestaurantCommand, auth: AuthorizationContext): Promise<RestaurantDTO> {
    await this.authorize(auth, "restaurants.suspend");

    const existing = await this.repository.findById(command.id);

    if (!existing) {
      throw new RestaurantNotFoundError(command.id);
    }

    this.statusPolicy.assertCanSuspend(existing.status);

    const suspended: Restaurant = {
      ...existing,
      status: RestaurantStatus.suspended(),
      updatedAt: new Date(),
    };

    const saved = await this.repository.update(suspended);

    await this.eventBus.emit(
      "RestaurantSuspended",
      new RestaurantSuspended(saved.id, command.reason),
    );

    return RestaurantMapper.toDTO(saved);
  }

  private toErrorDetails(errors: ValidationError[]): Record<string, string[]> {
    const details: Record<string, string[]> = {};

    for (const error of errors) {
      if (!details[error.field]) {
        details[error.field] = [];
      }
      details[error.field].push(error.message);
    }

    return details;
  }
}
