// tests/unit/progress.service.test.js
const ProgressService = require('../../services/progress.service');
const dbManager = require('../../database/manager');
const syncService = require('../../services/sync.service');

// Mock dependencies
jest.mock('../../database/manager');
jest.mock('../../services/sync.service');

describe('ProgressService', () => {
    let progressModel;
    let lessonModel;

    beforeEach(() => {
        jest.clearAllMocks();

        progressModel = {
            get: jest.fn(),
            update: jest.fn(),
            countCompleted: jest.fn()
        };

        lessonModel = {
            countByCourse: jest.fn()
        };

        dbManager.get.mockImplementation(modelName => {
            if (modelName === 'progress') return progressModel;
            if (modelName === 'lessons') return lessonModel;
        });
    });

    describe('getProgress', () => {
        it('should return progress for a user and course', async () => {
            const mockProgress = { userId: 1, courseId: 1, completedLessons: {} };
            progressModel.get.mockResolvedValue(mockProgress);

            const progress = await ProgressService.getProgress(1, 1);

            expect(progress).toEqual(mockProgress);
            expect(progressModel.get).toHaveBeenCalledWith(1, 1);
        });

        it('should throw an error if the database call fails', async () => {
            const error = new Error('Database error');
            progressModel.get.mockRejectedValue(error);
            await expect(ProgressService.getProgress(1, 1)).rejects.toThrow('Database error');
        });
    });

    describe('updateProgress', () => {
        it('should update progress for a lesson', async () => {
            lessonModel.countByCourse.mockResolvedValue(0); // Assume course not completed
            await ProgressService.updateProgress(1, 1, 'lesson1', true);

            expect(progressModel.update).toHaveBeenCalledWith(1, 1, {
                'completedLessons/lesson1': true,
                lastAccessed: expect.any(Number)
            });
        });

        it('should check for course completion and log a message if a lesson is completed', async () => {
            lessonModel.countByCourse.mockResolvedValue(5);
            progressModel.countCompleted.mockResolvedValue(5);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await ProgressService.updateProgress(1, 1, 'lesson5', true);

            expect(lessonModel.countByCourse).toHaveBeenCalledWith(1);
            expect(progressModel.countCompleted).toHaveBeenCalledWith(1, 1);
            expect(consoleSpy).toHaveBeenCalledWith('Course 1 completed by user 1!');
            
            consoleSpy.mockRestore();
        });

        it('should not check for course completion if a lesson is marked incomplete', async () => {
            await ProgressService.updateProgress(1, 1, 'lesson1', false);

            expect(lessonModel.countByCourse).not.toHaveBeenCalled();
            expect(progressModel.countCompleted).not.toHaveBeenCalled();
        });

        it('should throw an error if updating progress fails', async () => {
            const error = new Error('DB Error');
            progressModel.update.mockRejectedValue(error);
            await expect(ProgressService.updateProgress(1, 1, 'l1', true)).rejects.toThrow('DB Error');
        });
    });
});