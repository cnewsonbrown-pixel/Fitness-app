import { videoService } from '../../services/video.service';

// Mock the api module
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import api from '../../services/api';

const mockedApi = api as jest.Mocked<typeof api>;

describe('Video Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPrograms', () => {
    it('should fetch all programs', async () => {
      const mockPrograms = [
        { id: '1', name: 'Yoga Basics', category: 'Yoga', totalVideos: 10 },
        { id: '2', name: 'HIIT Training', category: 'Cardio', totalVideos: 8 },
      ];
      mockedApi.get.mockResolvedValue({ data: { data: mockPrograms } });

      const result = await videoService.getPrograms();

      expect(mockedApi.get).toHaveBeenCalledWith('/video/programs', { params: undefined });
      expect(result).toHaveLength(2);
    });

    it('should fetch programs with filters', async () => {
      const mockPrograms = [{ id: '1', name: 'Yoga Basics', category: 'Yoga' }];
      mockedApi.get.mockResolvedValue({ data: { data: mockPrograms } });

      const result = await videoService.getPrograms({
        category: 'Yoga',
        level: 'BEGINNER',
      });

      expect(mockedApi.get).toHaveBeenCalledWith('/video/programs', {
        params: { category: 'Yoga', level: 'BEGINNER' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('getProgram', () => {
    it('should fetch program by id', async () => {
      const mockProgram = {
        id: '1',
        name: 'Yoga Basics',
        description: 'Introduction to yoga',
        totalVideos: 10,
        totalDuration: 120,
      };
      mockedApi.get.mockResolvedValue({ data: { data: mockProgram } });

      const result = await videoService.getProgram('program-1');

      expect(mockedApi.get).toHaveBeenCalledWith('/video/programs/program-1');
      expect(result.name).toBe('Yoga Basics');
    });
  });

  describe('getProgramVideos', () => {
    it('should fetch videos for a program', async () => {
      const mockVideos = [
        { id: '1', title: 'Introduction', order: 1, duration: 300 },
        { id: '2', title: 'Warm Up', order: 2, duration: 600 },
      ];
      mockedApi.get.mockResolvedValue({ data: { data: mockVideos } });

      const result = await videoService.getProgramVideos('program-1');

      expect(mockedApi.get).toHaveBeenCalledWith('/video/programs/program-1/videos');
      expect(result).toHaveLength(2);
    });
  });

  describe('getVideo', () => {
    it('should fetch video by id', async () => {
      const mockVideo = {
        id: '1',
        title: 'Introduction',
        vimeoUrl: 'https://player.vimeo.com/video/123',
        duration: 300,
        level: 'BEGINNER',
      };
      mockedApi.get.mockResolvedValue({ data: { data: mockVideo } });

      const result = await videoService.getVideo('video-1');

      expect(mockedApi.get).toHaveBeenCalledWith('/video/video-1');
      expect(result.title).toBe('Introduction');
    });
  });

  describe('updateProgress', () => {
    it('should update video progress', async () => {
      const mockProgress = {
        videoId: '1',
        watchedSeconds: 150,
        isCompleted: false,
        lastWatchedAt: '2024-01-15T10:00:00Z',
      };
      mockedApi.post.mockResolvedValue({ data: { data: mockProgress } });

      const result = await videoService.updateProgress('video-1', 150);

      expect(mockedApi.post).toHaveBeenCalledWith('/video/video-1/progress', {
        watchedSeconds: 150,
      });
      expect(result.watchedSeconds).toBe(150);
    });
  });

  describe('markComplete', () => {
    it('should mark video as complete', async () => {
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await videoService.markComplete('video-1');

      expect(mockedApi.post).toHaveBeenCalledWith('/video/video-1/complete');
    });
  });

  describe('getContinueWatching', () => {
    it('should fetch continue watching list', async () => {
      const mockVideos = [
        { id: '1', title: 'In Progress Video', watchedSeconds: 150 },
      ];
      mockedApi.get.mockResolvedValue({ data: { data: mockVideos } });

      const result = await videoService.getContinueWatching();

      expect(mockedApi.get).toHaveBeenCalledWith('/video/continue-watching');
      expect(result).toHaveLength(1);
    });
  });

  describe('getRecommended', () => {
    it('should fetch recommended videos', async () => {
      const mockVideos = [
        { id: '1', title: 'Recommended Video 1' },
        { id: '2', title: 'Recommended Video 2' },
      ];
      mockedApi.get.mockResolvedValue({ data: { data: mockVideos } });

      const result = await videoService.getRecommended();

      expect(mockedApi.get).toHaveBeenCalledWith('/video/recommended');
      expect(result).toHaveLength(2);
    });
  });

  describe('getCategories', () => {
    it('should fetch video categories', async () => {
      const mockCategories = ['Yoga', 'Cardio', 'Strength', 'Wellness'];
      mockedApi.get.mockResolvedValue({ data: { data: mockCategories } });

      const result = await videoService.getCategories();

      expect(mockedApi.get).toHaveBeenCalledWith('/video/categories');
      expect(result).toHaveLength(4);
    });
  });
});
