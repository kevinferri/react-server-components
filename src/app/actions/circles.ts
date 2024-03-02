"use server";

import { z } from "zod";

import { prismaClient } from "@/lib/prisma/client";
import { getLoggedInUserId } from "@/lib/session";

const createCircleSchema = z.object({
  name: z
    .string({
      invalid_type_error: "Circle name required",
    })
    .min(1),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  members: z.string().nullable(),
  defaultTopicName: z.string().nullable(),
});

export async function createCircle(formData: FormData) {
  const userId = await getLoggedInUserId();
  if (!userId) return false;

  const validatedFields = createCircleSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    members: formData.get("members"),
    defaultTopicName: formData.get("defaultTopicName"),
  });

  if (!validatedFields.success) return false;

  const members = await prismaClient.user.findMany({
    where: {
      email: {
        in: validatedFields.data.members?.split(", "),
      },
    },
    select: { id: true },
  });

  let newCircle: { id?: string } = {};
  let defaultTopic: { id?: string } = {};

  try {
    await prismaClient.$transaction(async () => {
      const newCircle = await prismaClient.circle.create({
        data: {
          userId,
          name: validatedFields.data.name,
          description: validatedFields.data.description,
          imageUrl: validatedFields.data.imageUrl,

          members: {
            connect: [{ id: userId }, ...members],
          },
        },
        select: { id: true },
      });

      // Create default topic for circle
      defaultTopic = await prismaClient.topic.create({
        data: {
          userId,
          name: validatedFields.data.defaultTopicName ?? "General",
          circleId: newCircle.id,
          defaultForCircle: {
            connect: { id: newCircle.id },
          },
        },
        select: { id: true },
      });
    });
  } catch (err) {
    return false;
  }

  return {
    data: {
      ...newCircle,
      defaultTopicId: defaultTopic.id,
    },
  };
}
