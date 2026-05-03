"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getItemTemplateById } from "@/lib/demo-options";
import { getTodayDateString, toErrorMessage } from "@/lib/format";
import {
  deleteUnsoldItem,
  insertCustomItem,
  purchaseItem,
  updateItemPrice,
} from "@/lib/queries";

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseOptionalPrice(rawValue: string): number | null {
  if (!rawValue) {
    return null;
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error("价格必须是大于或等于 0 的数字。");
  }

  return Number(value.toFixed(2));
}

function getRequiredPrice(manualPrice: string, quickPrice: string, fallback?: number) {
  const parsedManual = parseOptionalPrice(manualPrice);
  const parsedQuick = parseOptionalPrice(quickPrice);
  const resolvedPrice = parsedManual ?? parsedQuick ?? fallback ?? null;

  if (resolvedPrice === null) {
    throw new Error("请填写价格，或选择一个快捷价格。");
  }

  return resolvedPrice;
}

function revalidateAppPages() {
  revalidatePath("/");
  revalidatePath("/items");
  revalidatePath("/users");
  revalidatePath("/orders");
}

function redirectWithMessage(type: "success" | "error", message: string) {
  const searchParams = new URLSearchParams({ [type]: message });
  redirect(`/items?${searchParams.toString()}`);
}

export async function createItemAction(formData: FormData) {
  let type: "success" | "error" = "success";
  let message = "";

  try {
    const template = getItemTemplateById(getString(formData, "templateId"));
    const customItemName = getString(formData, "itemName");
    const categoryInput = getString(formData, "category");
    const sellerId = getString(formData, "sellerId");

    const itemName = customItemName || template?.itemName || "";
    const category = categoryInput || template?.category || "";
    const price = getRequiredPrice(
      getString(formData, "price"),
      getString(formData, "quickPrice"),
      template?.price,
    );

    if (!itemName) {
      throw new Error("请填写商品名称，或先选择一个上架模板。");
    }

    if (!category) {
      throw new Error("请选择商品分类。");
    }

    if (!sellerId) {
      throw new Error("请选择发布用户。");
    }

    const itemId = await insertCustomItem({
      itemName,
      category,
      price,
      sellerId,
    });

    message = `已成功发布商品 ${itemId}。`;
  } catch (error) {
    type = "error";
    message = toErrorMessage(error);
  }

  revalidateAppPages();
  redirectWithMessage(type, message);
}

export async function updateItemPriceAction(formData: FormData) {
  let type: "success" | "error" = "success";
  let message = "";

  try {
    const itemId = getString(formData, "itemId");
    const price = getRequiredPrice(
      getString(formData, "price"),
      getString(formData, "quickPrice"),
    );

    if (!itemId) {
      throw new Error("请选择要定价的商品。");
    }

    await updateItemPrice(itemId, price);
    message = `已将商品 ${itemId} 的价格更新为 ${price.toFixed(2)} 元。`;
  } catch (error) {
    type = "error";
    message = toErrorMessage(error);
  }

  revalidateAppPages();
  redirectWithMessage(type, message);
}

export async function deleteUnsoldItemAction(formData: FormData) {
  let type: "success" | "error" = "success";
  let message = "";

  try {
    const itemId = getString(formData, "itemId");

    if (!itemId) {
      throw new Error("请选择要删除的未售出商品。");
    }

    await deleteUnsoldItem(itemId);
    message = `已删除未售出商品 ${itemId}。`;
  } catch (error) {
    type = "error";
    message = toErrorMessage(error);
  }

  revalidateAppPages();
  redirectWithMessage(type, message);
}

export async function purchaseItemAction(formData: FormData) {
  let type: "success" | "error" = "success";
  let message = "";

  try {
    const itemId = getString(formData, "itemId");
    const buyerId = getString(formData, "buyerId");
    const orderDate = getString(formData, "orderDate") || getTodayDateString();

    if (!itemId) {
      throw new Error("请选择要购买的商品。");
    }

    if (!buyerId) {
      throw new Error("请选择买家。");
    }

    const purchaseResult = await purchaseItem({
      itemId,
      buyerId,
      orderDate,
    });

    message = `购买成功，订单号为 ${purchaseResult.order_id}。`;
  } catch (error) {
    type = "error";
    message = toErrorMessage(error);
  }

  revalidateAppPages();
  redirectWithMessage(type, message);
}
