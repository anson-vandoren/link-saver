import logger from '../logger';
import Link from '../models/link';
import LinkTag from '../models/linkTag';
import Tag from '../models/tag';
import User from '../models/user';
import type { CreateLinkRequest, UpdateLinkRequest } from '../routers/link';

type LinkOperationResult = Promise<{
  success: boolean;
  reason?: string;
  newLink?: Link;
}>;

export async function deleteLink(linkId: number, userId: number): LinkOperationResult {
  const link = await Link.findOne({ where: { id: linkId, userId } });
  if (!link) {
    return { success: false, reason: `Cannot delete link with id ${linkId} - not found` };
  }
  await link.destroy();
  return { success: true };
}

export async function updateLink(linkId: number, userId: number, data: UpdateLinkRequest): LinkOperationResult {
  const link = await Link.findOne({ where: { id: linkId, userId } });
  if (!link) {
    return { success: false, reason: `Cannot update link with id ${linkId} - not found` };
  }
  // update all except tags
  await link.update({ ...data });

  // remove old tag associations
  await LinkTag.destroy({ where: { linkId } });

  // add new tag associations
  const { tags } = data;
  if (tags && tags.length) {
    for (const tagName of tags) {
      // TODO: try to get rid of await
      try {
        const [tagInstance] = await Tag.findOrCreate({ where: { name: tagName } });
        // TODO: try to get rid of await
        await LinkTag.create({ linkId, tagId: tagInstance.id });
      } catch (err) {
        logger.error(err);
        return { success: false, reason: `Failed to create tag ${tagName}` };
      }
    }
  }

  // retrieve updated link
  const newLink = await Link.findByPk(linkId, {
    include: [
      { model: Tag, through: { attributes: [] } },
      { model: User, attributes: ['username'] },
    ],
  }) ?? undefined;
  return { success: true, newLink };
}

type LinkAssocCreate = {
  linkId: number;
  tagId: number;
}[];
export async function createLink(userId: number, data: CreateLinkRequest): LinkOperationResult {
  const { tags, ...linkData } = data;
  if (!linkData.isPublic) {
    linkData.isPublic = false;
  }
  const link = await Link.create({ ...linkData, userId });
  const associationsToCreate: LinkAssocCreate = [];
  if (tags && tags.length) {
    for (const tagName of tags) {
      try {
        const [tagInstance] = await Tag.findOrCreate({ where: { name: tagName } });
        associationsToCreate.push({ linkId: link.id, tagId: tagInstance.id });
      } catch (err) {
        logger.error(err);
        return { success: false, reason: `Failed to create tag ${tagName}` };
      }
    }
  }
  await LinkTag.bulkCreate(associationsToCreate);
  const newLink = await Link.findByPk(link.id, {
    include: [
      { model: Tag, through: { attributes: [] } },
      { model: User, attributes: ['username'] },
    ],
  }) ?? undefined;
  return { success: true, newLink };
}
