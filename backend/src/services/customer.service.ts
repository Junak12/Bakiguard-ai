
import { Customer } from "../model/Customer.js";
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
} from "../validators/customer.validator.js";

export async function createCustomer(
  userId: string,
  input: CreateCustomerInput
) {
  const existingCustomer = await Customer.findOne({
    userId,
    phone: input.phone,
  });

  if (existingCustomer) {
    const error = new Error(
      "A customer with this phone number already exists."
    );

    (error as any).statusCode = 409;

    throw error;
  }

  const customer = await Customer.create({
    userId,
    name: input.name,
    phone: input.phone,
    address: input.address,
  });

  return customer;
}

export async function getCustomers(userId: string) {
  return Customer.find({ userId })
    .sort({ createdAt: -1 })
    .select("-__v");
}

export async function getCustomerById(
  userId: string,
  customerId: string
) {
  const customer = await Customer.findOne({
    _id: customerId,
    userId,
  }).select("-__v");

  if (!customer) {
    const error = new Error("Customer not found.");
    (error as any).statusCode = 404;
    throw error;
  }

  return customer;
}

export async function updateCustomer(
  userId: string,
  customerId: string,
  input: UpdateCustomerInput
) {
  return Customer.findOneAndUpdate(
    {
      _id: customerId,
      userId,
    },
    {
      $set: input,
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("-__v");
}

export async function deleteCustomer(
  userId: string,
  customerId: string
) {
  return Customer.findOneAndDelete({
    _id: customerId,
    userId,
  });
}