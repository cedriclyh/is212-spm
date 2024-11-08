import {
    getTotalCount,
    getListofStaffs,
} from '../component/CalendarView/Dashboard';
import {
    getListofStaffUnderManager,
} from '../component/CalendarView/CalendarUtils';

global.fetch = jest.fn();

describe('getListofStaffs', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return a list of staff with fullName and position when the request is successful', async () => {
        const mockData = {
            data: [
                {
                    staff_fname: 'John',
                    staff_lname: 'Doe',
                    position: 'Engineer'
                },
                {
                    staff_fname: 'Jane',
                    staff_lname: 'Smith',
                    position: 'Manager'
                }
            ]
        };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockData
        });

        const result = await getListofStaffs(140008);

        expect(result).toEqual([
            { fullName: 'John Doe', position: 'Engineer' },
            { fullName: 'Jane Smith', position: 'Manager' }
        ]);

        expect(fetch).toHaveBeenCalledWith('http://54.84.53.208:5002/users/team/140008', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
    });

    it('should return undefined if the fetch response is not ok', async () => {
        fetch.mockResolvedValueOnce({
            ok: false
        });

        const result = await getListofStaffs(140008);
        expect(result).toBeUndefined();
    });

    it('should handle network errors gracefully and log an error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        // Mock fetch to throw a network error
        fetch.mockRejectedValueOnce(new Error('Network error'));

        const result = await getListofStaffs(140008);

        expect(result).toBeUndefined();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Failed to fetch list of staffs under the manager:',
            expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
    });
});

describe('getTotalCount', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return the total team count when the request is successful', async () => {
        const mockData = {
            team_count: 10
        };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockData
        });

        const result = await getTotalCount(140008);

        // Verify the output
        expect(result).toBe(10);

        expect(fetch).toHaveBeenCalledWith('http://54.84.53.208:5002/users/team/140008', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
    });

    it('should return undefined if the fetch response is not ok', async () => {
        fetch.mockResolvedValueOnce({
            ok: false
        });

        const result = await getTotalCount(140004);

        expect(result).toBeUndefined();
    });

    it('should handle network errors gracefully and log an error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        fetch.mockRejectedValueOnce(new Error('Network error'));

        const result = await getTotalCount(140004);

        expect(result).toBeUndefined();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Failed to fetch list of staffs under the manager:',
            expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
    });
});