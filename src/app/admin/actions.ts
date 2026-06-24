"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db } from "@/server/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") throw new Error("No autorizado");
}

export async function approveUser(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  await db.user.update({ where: { id }, data: { approved: true } });
  revalidatePath("/admin");
}

export async function rejectUser(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  await db.user.delete({ where: { id } });
  revalidatePath("/admin");
}

export async function createColorPreset(formData: FormData) {
  await requireAdmin();
  await db.colorPreset.create({
    data: {
      name:         formData.get("name") as string,
      colorPrimary: formData.get("colorPrimary") as string,
      colorBg:      formData.get("colorBg") as string,
    },
  });
  revalidatePath("/admin");
}

export async function deleteColorPreset(formData: FormData) {
  await requireAdmin();
  await db.colorPreset.delete({ where: { id: formData.get("id") as string } });
  revalidatePath("/admin");
}

export async function createLogoPreset(formData: FormData) {
  await requireAdmin();
  await db.logoPreset.create({
    data: {
      name:     formData.get("name") as string,
      imageUrl: formData.get("imageUrl") as string,
    },
  });
  revalidatePath("/admin");
}

export async function deleteLogoPreset(formData: FormData) {
  await requireAdmin();
  await db.logoPreset.delete({ where: { id: formData.get("id") as string } });
  revalidatePath("/admin");
}

export async function toggleOfferWhitelist(formData: FormData) {
  await requireAdmin();
  const offerId   = formData.get("offerId") as string;
  const offerName = formData.get("offerName") as string;
  const current   = formData.get("current") === "true";
  await db.offerConfig.upsert({
    where:  { offerId },
    create: { offerId, offerName, whitelisted: !current },
    update: { whitelisted: !current },
  });
  revalidatePath("/admin");
  revalidatePath("/offers");
}

export async function updateOfferImage(formData: FormData) {
  await requireAdmin();
  const offerId   = formData.get("offerId") as string;
  const offerName = formData.get("offerName") as string;
  const imageUrl  = formData.get("imageUrl") as string;
  await db.offerConfig.upsert({
    where:  { offerId },
    create: { offerId, offerName, imageUrl },
    update: { imageUrl },
  });
  revalidatePath("/admin");
  revalidatePath("/offers");
}
