import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

// ============================================
// VIDEO PROGRAMS
// ============================================

export const createProgram = async (
  tenantId: string,
  data: {
    title: string;
    slug: string;
    description?: string;
    thumbnail?: string;
    category?: string;
    level?: string;
    isPaid?: boolean;
    price?: number;
    isPublished?: boolean;
    sortOrder?: number;
  }
) => {
  return prisma.videoProgram.create({
    data: { tenantId, ...data } as Prisma.VideoProgramUncheckedCreateInput,
    include: { videos: true },
  });
};

export const updateProgram = async (
  tenantId: string,
  id: string,
  data: Partial<{
    title: string;
    slug: string;
    description: string;
    thumbnail: string;
    category: string;
    level: string;
    isPaid: boolean;
    price: number;
    isPublished: boolean;
    sortOrder: number;
  }>
) => {
  return prisma.videoProgram.update({
    where: { id, tenantId },
    data,
    include: { videos: true },
  });
};

export const deleteProgram = async (tenantId: string, id: string) => {
  return prisma.videoProgram.delete({ where: { id, tenantId } });
};

export const getProgram = async (tenantId: string, id: string) => {
  return prisma.videoProgram.findFirst({
    where: { id, tenantId },
    include: { videos: { orderBy: { sortOrder: 'asc' } } },
  });
};

export const getProgramBySlug = async (tenantId: string, slug: string) => {
  return prisma.videoProgram.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
    include: { videos: { orderBy: { sortOrder: 'asc' } } },
  });
};

export const listPrograms = async (
  tenantId: string,
  opts: { publishedOnly?: boolean; category?: string }
) => {
  const where: Prisma.VideoProgramWhereInput = { tenantId };
  if (opts.publishedOnly) where.isPublished = true;
  if (opts.category) where.category = opts.category;

  return prisma.videoProgram.findMany({
    where,
    include: { _count: { select: { videos: true } } },
    orderBy: { sortOrder: 'asc' },
  });
};

// ============================================
// VIDEOS
// ============================================

export const createVideo = async (
  tenantId: string,
  data: {
    title: string;
    description?: string;
    thumbnail?: string;
    duration?: number;
    vimeoId?: string;
    videoUrl?: string;
    level?: string;
    isPaid?: boolean;
    isPublished?: boolean;
    programId?: string;
    sortOrder?: number;
  }
) => {
  return prisma.video.create({
    data: { tenantId, ...data } as Prisma.VideoUncheckedCreateInput,
  });
};

export const updateVideo = async (
  tenantId: string,
  id: string,
  data: Partial<{
    title: string;
    description: string;
    thumbnail: string;
    duration: number;
    vimeoId: string;
    videoUrl: string;
    level: string;
    isPaid: boolean;
    isPublished: boolean;
    programId: string;
    sortOrder: number;
  }>
) => {
  return prisma.video.update({ where: { id, tenantId }, data });
};

export const deleteVideo = async (tenantId: string, id: string) => {
  return prisma.video.delete({ where: { id, tenantId } });
};

export const getVideo = async (tenantId: string, id: string) => {
  return prisma.video.findFirst({
    where: { id, tenantId },
    include: { program: true },
  });
};

export const listVideos = async (
  tenantId: string,
  opts: { publishedOnly?: boolean; programId?: string; level?: string }
) => {
  const where: Prisma.VideoWhereInput = { tenantId };
  if (opts.publishedOnly) where.isPublished = true;
  if (opts.programId) where.programId = opts.programId;
  if (opts.level) where.level = opts.level as any;

  return prisma.video.findMany({
    where,
    include: { program: { select: { id: true, title: true, slug: true } } },
    orderBy: { sortOrder: 'asc' },
  });
};

// ============================================
// PROGRESS TRACKING
// ============================================

export const updateProgress = async (
  tenantId: string,
  memberId: string,
  videoId: string,
  watchedSeconds: number,
  totalSeconds: number
) => {
  const completed = totalSeconds > 0 && watchedSeconds / totalSeconds >= 0.9;

  return prisma.videoProgress.upsert({
    where: { videoId_memberId: { videoId, memberId } },
    create: {
      tenantId,
      videoId,
      memberId,
      watchedSeconds,
      totalSeconds,
      completed,
      completedAt: completed ? new Date() : null,
    },
    update: {
      watchedSeconds,
      totalSeconds,
      completed,
      completedAt: completed ? new Date() : undefined,
      lastWatchedAt: new Date(),
    },
  });
};

export const getProgress = async (tenantId: string, memberId: string, videoId: string) => {
  return prisma.videoProgress.findUnique({
    where: { videoId_memberId: { videoId, memberId } },
  });
};

export const getMemberProgress = async (tenantId: string, memberId: string) => {
  return prisma.videoProgress.findMany({
    where: { tenantId, memberId },
    include: { video: { select: { id: true, title: true, thumbnail: true, duration: true } } },
    orderBy: { lastWatchedAt: 'desc' },
  });
};

// ============================================
// ANALYTICS
// ============================================

export const getVideoAnalytics = async (tenantId: string, videoId: string) => {
  const [viewCount, completionData] = await Promise.all([
    prisma.videoProgress.count({ where: { tenantId, videoId } }),
    prisma.videoProgress.aggregate({
      where: { tenantId, videoId },
      _avg: { watchedSeconds: true },
      _count: { _all: true },
    }),
  ]);

  const completedCount = await prisma.videoProgress.count({
    where: { tenantId, videoId, completed: true },
  });

  return {
    viewCount,
    completedCount,
    completionRate: viewCount > 0 ? completedCount / viewCount : 0,
    avgWatchedSeconds: completionData._avg.watchedSeconds || 0,
  };
};

export const getLibraryAnalytics = async (tenantId: string) => {
  const [totalVideos, totalPrograms, totalViews, totalCompletions] = await Promise.all([
    prisma.video.count({ where: { tenantId } }),
    prisma.videoProgram.count({ where: { tenantId } }),
    prisma.videoProgress.count({ where: { tenantId } }),
    prisma.videoProgress.count({ where: { tenantId, completed: true } }),
  ]);

  return {
    totalVideos,
    totalPrograms,
    totalViews,
    totalCompletions,
    completionRate: totalViews > 0 ? totalCompletions / totalViews : 0,
  };
};

export const videoService = {
  createProgram,
  updateProgram,
  deleteProgram,
  getProgram,
  getProgramBySlug,
  listPrograms,
  createVideo,
  updateVideo,
  deleteVideo,
  getVideo,
  listVideos,
  updateProgress,
  getProgress,
  getMemberProgress,
  getVideoAnalytics,
  getLibraryAnalytics,
};
