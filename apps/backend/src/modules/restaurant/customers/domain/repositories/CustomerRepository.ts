import type { Customer } from "../models/Customer.js";
import type { CustomerEmail } from "../models/CustomerEmail.js";
import type { CustomerPhone } from "../models/CustomerPhone.js";

export interface CustomerRepository {
  save(customer: Customer): Promise<Customer>;
  update(customer: Customer): Promise<Customer>;
  findById(id: string): Promise<Customer | null>;
  findByIdAndRestaurant(id: string, restaurantId: string): Promise<Customer | null>;
  findByRestaurantId(restaurantId: string): Promise<Customer[]>;
  findByEmailAndRestaurant(email: CustomerEmail, restaurantId: string): Promise<Customer | null>;
  findByPhoneAndRestaurant(phone: CustomerPhone, restaurantId: string): Promise<Customer | null>;
}
