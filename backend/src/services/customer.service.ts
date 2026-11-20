import { Customer } from "../model/Customer.js";
import { AppError } from "../utils/AppError.js";
import { assertCanAddCustomer } from "./billing.service.js";
import { getAgingReport } from "./ledger.service.js";
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
} from "../validators/customer.validator.js";

const DUPLICATE_PHONE_MESSAGE =
  "A customer with this phone number already exists.";

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === 11000
  );
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const activeCustomer = (userId: string, customerId?: string) => ({
  userId,
  isArchived: false,
  ...(customerId ? { _id: customerId } : {}),
});

export async function createCustomer(userId: string, input: CreateCustomerInput) {
  await assertCanAddCustomer(userId);

  try {
    return await Customer.create({
      userId,
      name: input.name,
      phone: input.phone,
      address: input.address,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw AppError.conflict(DUPLICATE_PHONE_MESSAGE, "DUPLICATE_PHONE");
    }

    throw error;
  }
}

export interface CustomerListOptions {
  search?: string;
  /** "overdue": has money past its due date. "due": owes anything. */
  status?: "all" | "due" | "overdue";
}

export async function getCustomers(userId: string, options: CustomerListOptions = {}) {
  const filter: Record<string, unknown> = activeCustomer(userId);

  if (options.search) {
    const pattern = new RegExp(escapeRegex(options.search), "i");
    filter.$or = [{ name: pattern }, { phone: pattern }];
  }

  if (options.status === "due") {
    filter.totalDue = { $gt: 0 };
  }

  if (options.status === "overdue") {
    filter.nextDueAt = { $ne: null, $lt: new Date() };
  }

  return Customer.find(filter)
    // Overdue list: most overdue first. Otherwise newest first.
    .sort(options.status === "overdue" ? { nextDueAt: 1 } : { createdAt: -1 })
    .select("-__v")
    .lean();
}

export async function getCustomerById(userId: string, customerId: string) {
  const customer = await Customer.findOne(activeCustomer(userId, customerId))
    .select("-__v")
    .lean();

  if (!customer) {
    throw AppError.notFound("Customer not found");
  }

  const aging = await getAgingReport(userId, customerId);

  return {
    ...customer,
    overdueAmount: aging.totalOverdue,
    aging: aging.buckets,
  };
}

export async function updateCustomer(
  userId: string,
  customerId: string,
  input: UpdateCustomerInput
) {
  try {
    const customer = await Customer.findOneAndUpdate(
      activeCustomer(userId, customerId),
      { $set: input },
      { returnDocument: "after", runValidators: true }
    )
      .select("-__v")
      .lean();

    if (!customer) {
      throw AppError.notFound("Customer not found");
    }

    return customer;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw AppError.conflict(DUPLICATE_PHONE_MESSAGE, "DUPLICATE_PHONE");
    }

    throw error;
  }
}

/**
 * Archives the customer. Their transactions stay in the ledger so
 * shop totals and history remain correct.
 */
export async function archiveCustomer(userId: string, customerId: string) {
  const customer = await Customer.findOne(activeCustomer(userId, customerId));

  if (!customer) {
    throw AppError.notFound("Customer not found");
  }

  if (customer.totalDue > 0) {
    throw AppError.conflict(
      `This customer still owes ৳${customer.totalDue.toLocaleString("en-US")}. ` +
        "Record their payment before removing them.",
      "CUSTOMER_HAS_DUE"
    );
  }

  customer.isArchived = true;
  customer.archivedAt = new Date();
  await customer.save();
}
