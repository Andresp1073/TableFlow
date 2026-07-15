import type { PointsAccount } from "../models/PointsAccount.js";
import type { PointsTransaction } from "../models/PointsTransaction.js";

export interface PointsAccountRepository {
  findById(id: string): Promise<PointsAccount | null>;
  findByCustomerProfileId(customerProfileId: string): Promise<PointsAccount[]>;
  findByProgramId(programId: string): Promise<PointsAccount[]>;
  findByRestaurant(restaurantId: string): Promise<PointsAccount[]>;
  save(account: PointsAccount): Promise<void>;
  delete(id: string): Promise<void>;

  findTransactionsByAccountId(accountId: string): Promise<PointsTransaction[]>;
  findTransactionsByReference(referenceId: string): Promise<PointsTransaction[]>;
  saveTransaction(transaction: PointsTransaction): Promise<void>;
}
