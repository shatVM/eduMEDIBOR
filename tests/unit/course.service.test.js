// tests/unit/course.service.test.js
const CourseService = require('../../services/course.service');
const dbManager = require('../../database/manager');

// Mock the dbManager to isolate the service
jest.mock('../../database/manager');

describe('CourseService', () => {
    let courseModel;
    let lessonModel;
    let quizModel;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Setup mock models for each database entity
        courseModel = {
            findAll: jest.fn(),
            findById: jest.fn(),
        };
        lessonModel = {
            findByCourse: jest.fn(),
        };
        quizModel = {
            findBySet: jest.fn(),
        };
        
        // Mock dbManager.get to return the appropriate model
        dbManager.get.mockImplementation(modelName => {
            const models = {
                courses: courseModel,
                lessons: lessonModel,
                quizzes: quizModel,
            };
            return models[modelName];
        });
    });

    describe('getAllCourses', () => {
        it('should return all courses from the database model', async () => {
            const mockCourses = [{ id: 1, title: 'Test Course 1' }, { id: 2, title: 'Test Course 2' }];
            courseModel.findAll.mockResolvedValue(mockCourses);

            const courses = await CourseService.getAllCourses();

            expect(courses).toEqual(mockCourses);
            expect(dbManager.get).toHaveBeenCalledWith('courses');
            expect(courseModel.findAll).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if the database call fails', async () => {
            const error = new Error('Database error');
            courseModel.findAll.mockRejectedValue(error);

            await expect(CourseService.getAllCourses()).rejects.toThrow('Database error');
        });
    });

    describe('getCourseById', () => {
        it('should return a course by its ID from the database model', async () => {
            const mockCourse = { id: 'bls', title: 'Test Course' };
            courseModel.findById.mockResolvedValue(mockCourse);

            const course = await CourseService.getCourseById('bls');

            expect(course).toEqual(mockCourse);
            expect(dbManager.get).toHaveBeenCalledWith('courses');
            expect(courseModel.findById).toHaveBeenCalledWith('bls');
        });

        it('should return null if course is not found', async () => {
            courseModel.findById.mockResolvedValue(null);

            const course = await CourseService.getCourseById(999);

            expect(course).toBeNull();
        });

        it('should throw an error if the database call fails', async () => {
            const error = new Error('Database error');
            courseModel.findById.mockRejectedValue(error);

            await expect(CourseService.getCourseById(1)).rejects.toThrow('Database error');
        });
    });

    describe('getCourseWithDetails', () => {
        it('should return a course with its modules and quizzes', async () => {
            const mockCourse = { id: 1, title: 'Detailed Course' };
            const mockModules = [
                { id: 101, course_id: 1, title: 'Module 1' },
                { id: 102, course_id: 1, title: 'Module 2' }
            ];
            const mockQuizzes1 = [{ id: 201, question: 'What is...?' }];
            const mockQuizzes2 = [{ id: 202, question: 'How to...?' }];

            courseModel.findById.mockResolvedValue(mockCourse);
            lessonModel.findByCourse.mockResolvedValue(mockModules);
            quizModel.findBySet.mockImplementation(moduleId => {
                if (moduleId === 101) return Promise.resolve(mockQuizzes1);
                if (moduleId === 102) return Promise.resolve(mockQuizzes2);
                return Promise.resolve([]);
            });

            const courseDetails = await CourseService.getCourseWithDetails(1);

            expect(courseModel.findById).toHaveBeenCalledWith(1);
            expect(lessonModel.findByCourse).toHaveBeenCalledWith(1);
            expect(quizModel.findBySet).toHaveBeenCalledWith(101);
            expect(quizModel.findBySet).toHaveBeenCalledWith(102);
            
            expect(courseDetails).not.toBeNull();
            expect(courseDetails.title).toBe('Detailed Course');
            expect(courseDetails.lessons).toBeDefined();
            expect(courseDetails.lessons.length).toBe(2);
            expect(courseDetails.lessons[0].quizzes).toEqual(mockQuizzes1);
            expect(courseDetails.lessons[1].quizzes).toEqual(mockQuizzes2);
        });

        it('should return null if the course does not exist', async () => {
            courseModel.findById.mockResolvedValue(null);
            const courseDetails = await CourseService.getCourseWithDetails(999);
            expect(courseDetails).toBeNull();
        });

        it('should throw an error if finding the course fails', async () => {
            const error = new Error('DB Error');
            courseModel.findById.mockRejectedValue(error);
            await expect(CourseService.getCourseWithDetails(1)).rejects.toThrow('DB Error');
        });

        it('should throw an error if finding the modules fails', async () => {
            const mockCourse = { id: 1, title: 'Detailed Course' };
            courseModel.findById.mockResolvedValue(mockCourse);
            const error = new Error('DB Error');
            lessonModel.findByCourse.mockRejectedValue(error);
            await expect(CourseService.getCourseWithDetails(1)).rejects.toThrow('DB Error');
        });
    });
});