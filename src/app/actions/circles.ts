"use server";

import { z } from "zod";

import { prismaClient } from "@/lib/prisma/client";
import { getLoggedInUserId } from "@/lib/session";

const upsertCircleSchema = z.object({
  name: z
    .string({
      invalid_type_error: "Circle name required",
    })
    .min(1),
  circleId: z.string().nullable(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  members: z.string().nullable(),
  defaultTopicName: z.string().nullable(),
});

export async function upsertCircle(formData: FormData) {
  const userId = await getLoggedInUserId();
  if (!userId) return false;

  const validatedFields = upsertCircleSchema.safeParse({
    name: formData.get("name"),
    circleId: formData.get("circleId"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    members: formData.get("members"),
    defaultTopicName: formData.get("defaultTopicName"),
  });

  if (!validatedFields.success) return false;

  const circleId = validatedFields.data.circleId;
  const existingCirle = circleId
    ? await prismaClient.circle.findUnique({
        where: {
          id: circleId,
        },
        select: {
          id: true,
          userId: true,
          defaultTopicId: true,
        },
      })
    : undefined;

  // Make sure cur user is creator of current circle
  if (existingCirle && existingCirle.userId !== userId) return false;

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
      const data = {
        userId,
        name: validatedFields.data.name,
        description: validatedFields.data.description,
        imageUrl: validatedFields.data.imageUrl,

        members: {
          connect: [{ id: userId }, ...members],
        },
      };

      const newCircle = await prismaClient.circle.upsert({
        where: {
          id: circleId ?? undefined,
        },
        create: data,
        update: data,
        select: { id: true },
      });

      // Create default topic on circle creation
      if (!existingCirle) {
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
      }
    });
  } catch (err) {
    return false;
  }

  return {
    data: {
      ...newCircle,
      defaultTopicId: defaultTopic.id ?? existingCirle?.defaultTopicId,
    },
  };
}
