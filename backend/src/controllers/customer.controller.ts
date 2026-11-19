import type { Response } from "express";

import { getUserId, type AuthRequest } from "../middleware/auth.middleware.js";
import {
  archiveCustomer,
  createCustomer,
  getCustomerById,
  getCustomers,
  updateCustomer,
} from "../services/customer.service.js";
import { idParamSchema } from "../validators/common.validator.js";
import {
  createCustomerSchema,
  listCustomersQuerySchema,
  updateCustomerSchema,
} from "../validators/customer.validator.js";

export async function create(req: AuthRequest, res: Response) {
  const input = createCustomerSchema.parse(req.body);

  const customer = await createCustomer(getUserId(req), input);

  res.status(201).json({
    success: true,
    message: "Customer created successfully",
    data: customer,
  });
}

export async function getAll(req: AuthRequest, res: Response) {
  const options = listCustomersQuerySchema.parse(req.query);

  const customers = await getCustomers(getUserId(req), options);

  res.status(200).json({
    success: true,
    data: customers,
  });
}

export async function getOne(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);

  const customer = await getCustomerById(getUserId(req), id);

  res.status(200).json({
    success: true,
    data: customer,
  });
}

export async function update(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const input = updateCustomerSchema.parse(req.body);

  const customer = await updateCustomer(getUserId(req), id, input);

  res.status(200).json({
    success: true,
    message: "Customer updated successfully",
    data: customer,
  });
}

export async function remove(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);

  await archiveCustomer(getUserId(req), id);

  res.status(200).json({
    success: true,
    message: "Customer removed successfully",
  });
}
