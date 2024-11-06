// src/tests/CalendarUtils.test.js
import {
    getValidRange,
    getStaffInformation,
    getDeptName,
    getApprovedandPendingandCancelledEvents,
    getApprovedandPendingEvents,
    getApprovedEventsOnly,
    getListofStaffUnderManager,
    getPersonalEvents,
    getStaffTeamEvents,
    getManagerTeamEvents,
    getDirectorTeamEvents,
    getHRTeamEvents,
    getBlockoutDates
} from '../utils/CalendarUtils';
import { addMonths, subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

// Mock fetch globally
global.fetch = jest.fn();

describe('CalendarUtils', () => {
    beforeEach(() => {
        fetch.mockClear();
    });

    describe('getValidRange', () => {
        it('should return correct date range', () => {
            const today = new Date('2024-01-15');
            const expected = {
                start: format(subMonths(startOfMonth(today), 2), 'yyyy-MM-dd'),
                end: format(addMonths(endOfMonth(today), 3), 'yyyy-MM-dd')
            };
            const result = getValidRange(today);
            expect(result).toEqual(expected);
        });
    });

    describe('getStaffInformation', () => {
        it('should extract correct staff information from data object', () => {
            const mockData = {
                reporting_manager: 123,
                role: 2,
                dept: 'IT',
                position: 'Developer',
                staff_fname: 'John',
                staff_lname: 'Doe',
                staff_id: 456
            };

            const result = getStaffInformation(mockData);

            expect(result).toEqual({
                manager_id: 123,
                role_num: 2,
                dept: 'IT',
                position: 'Developer',
                staff_fname: 'John',
                staff_lname: 'Doe',
                staff_id: 456
            });
        });

        it('should throw error for invalid data', () => {
            expect(() => getStaffInformation(null)).toThrow('Invalid data object');
        });
    });

    describe('getDeptName', () => {
        it('should return department name for valid user ID', async () => {
            const mockResponse = {
                data: {
                    dept: 'IT'
                }
            };
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await getDeptName(123);
            expect(result).toBe('IT');
            expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:5002/user/123');
        });

        it('should return null on error', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'));
            const result = await getDeptName(123);
            expect(result).toBeNull();
        });
    });

    describe('getApprovedandPendingandCancelledEvents', () => {
        it('should return formatted events including rejected status', async () => {
            const mockRequests = {
                data: [
                    {
                        request_id: 1,
                        staff_id: 123,
                        manager_id: 456,
                        arrangement_date: '2024-01-15',
                        timeslot: 'AM',
                        status: 'Approved'
                    }
                ]
            };

            const mockUserData = {
                data: {
                    staff_fname: 'John',
                    staff_lname: 'Doe',
                    dept: 'IT'
                }
            };

            // Mock fetch for requests
            fetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockRequests)
                })
                // Mock fetch for user data (called multiple times for staff and manager)
                .mockResolvedValue({
                    ok: true,
                    json: () => Promise.resolve(mockUserData)
                });

            const events = await getApprovedandPendingandCancelledEvents(123);
            expect(events).toHaveLength(1);
            expect(events[0]).toMatchObject({
                id: expect.any(String),
                title: expect.any(String),
                start: expect.stringContaining('2024-01-15'),
                end: expect.stringContaining('2024-01-15'),
                backgroundColor: expect.any(String)
            });
        });
    });

    describe('getBlockoutDates', () => {
        it('should return formatted blockout events', async () => {
            const mockBlockouts = {
                data: [
                    {
                        blockout_id: 1,
                        title: 'Holiday',
                        start_date: '2024-01-15',
                        end_date: '2024-01-15',
                        timeslot: 'FULL'
                    }
                ]
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockBlockouts)
            });

            const events = await getBlockoutDates('dayGridMonth');
            expect(events).toHaveLength(1);
            expect(events[0]).toMatchObject({
                id: 1,
                title: 'Holiday',
                start: expect.stringContaining('2024-01-15'),
                end: expect.stringContaining('2024-01-15'),
                allDay: true
            });
        });

        it('should handle AM/PM timeslots correctly', async () => {
            const mockBlockouts = {
                data: [
                    {
                        blockout_id: 1,
                        title: 'Morning Block',
                        start_date: '2024-01-15',
                        end_date: '2024-01-15',
                        timeslot: 'AM'
                    },
                    {
                        blockout_id: 2,
                        title: 'Afternoon Block',
                        start_date: '2024-01-15',
                        end_date: '2024-01-15',
                        timeslot: 'PM'
                    }
                ]
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockBlockouts)
            });

            const events = await getBlockoutDates('timeGridWeek');
            expect(events).toHaveLength(2);

            // Check AM blockout
            expect(events[0]).toMatchObject({
                id: 1,
                title: 'Morning Block',
                start: expect.stringContaining('T09:00:00'),
                end: expect.stringContaining('T13:00:00'),
                allDay: false
            });

            // Check PM blockout
            expect(events[1]).toMatchObject({
                id: 2,
                title: 'Afternoon Block',
                start: expect.stringContaining('T14:00:00'),
                end: expect.stringContaining('T18:00:00'),
                allDay: false
            });
        });

        it('should handle API errors gracefully', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'));
            const result = await getBlockoutDates('dayGridMonth');
            expect(result).toBeNull();
        });
    });
});