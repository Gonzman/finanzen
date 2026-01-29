import type { ExpandTimeTable } from '@/lib/pb';
import type { TimetableResponse } from '@/lib/pocketbase-types';
import ExcelJS from 'exceljs';

async function createExcel(data: TimetableResponse<ExpandTimeTable>, peopleMap: Map<string, string>): Promise<Blob> {
    const shifts = data.expand?.shift_via_timetable || [];

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Arbeitsplaner');

    // Set column widths
    worksheet.columns = [
        { width: 5 }, // Empty first column
        { width: 10 }, // Schicht
        { width: 10 }, // Dauer
        { width: 12 }, // Uhrzeit
        { width: 40 }, // Hefer
        { width: 30 }, // Aufgaben
        { width: 3 }, // Leere Spalte
    ];

    // Define border style
    const borderStyle: Partial<ExcelJS.Border> = {
        style: 'thin',
        color: { argb: 'FF000000' },
    };
    const borders: Partial<ExcelJS.Borders> = {
        top: borderStyle,
        left: borderStyle,
        bottom: borderStyle,
        right: borderStyle,
    };

    // Group shifts by date
    const shiftsByDate = new Map<string, typeof shifts>();

    shifts.forEach((shift) => {
        const date = shift.date.split(' ')[0];
        if (!shiftsByDate.has(date)) {
            shiftsByDate.set(date, []);
        }
        shiftsByDate.get(date)!.push(shift);
    });

    worksheet.addRow([null, null, null, null, null, null, null]);

    // Sort dates chronologically
    const sortedDates = Array.from(shiftsByDate.keys()).sort();

    // Add data for each date
    sortedDates.forEach((date, dateIndex) => {
        // Add empty row before each new date (except the first one)
        if (dateIndex > 0) {
            worksheet.addRow([null, null, null, null, null, null, null]);
            worksheet.addRow([null, null, null, null, null, null, null]);
        }

        // Add date header row
        const formattedDate = new Date(date).toLocaleDateString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const dateRow = worksheet.addRow([null, `Datum: ${formattedDate}`, null, null, null, null, null]);
        dateRow.font = { color: { argb: '00FF0000' }, bold: true };

        // Merge cells for the date header row (columns B-D)
        worksheet.mergeCells(dateRow.number, 2, dateRow.number, 4);
        worksheet.addRow([null, null, null, null, null, null, null]);

        // Add column headers for this date section
        const headerRow = worksheet.addRow([null, 'Schicht', 'Dauer', 'Uhrzeit', 'Helfer', 'Aufgaben', null]);
        headerRow.font = { bold: true };
        for (let i = 2; i <= 6; i++) {
            headerRow.getCell(i).border = borders;
            headerRow.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF808080' } };
        }

        // Add shifts for this date
        const dateShifts = shiftsByDate.get(date) || [];

        // Sort shifts by start time
        dateShifts.sort((a, b) => a.startTime.localeCompare(b.startTime));

        dateShifts.forEach((shift, index) => {
            const id = String.fromCharCode(65 + index); // A, B, C, etc.
            const startTime = shift.startTime;
            const endTime = shift.endTime;
            const purpose = shift.purpose;
            const persons = shift.people && shift.people.length > 0 ? shift.people.map((personId) => peopleMap.get(personId) || personId).join(', ') : 'Keine Personen zugewiesen';
            const timeRange = `${startTime} - ${endTime}`;

            // Calculate duration
            const [startH, startM] = startTime.split(':').map(Number);
            const [endH, endM] = endTime.split(':').map(Number);
            let startMinutes = startH * 60 + startM;
            let endMinutes = endH * 60 + endM;
            if (endMinutes < startMinutes) {
                endMinutes += 24 * 60;
            }
            const durationMinutes = endMinutes - startMinutes;
            const durationHours = Math.floor(durationMinutes / 60);
            const durationMins = durationMinutes % 60;
            const duration = `${durationHours}h ${durationMins}m`;
            const shiftRow = worksheet.addRow([null, id, duration, timeRange, persons, purpose, null]);

            // Set row height
            shiftRow.height = 25;

            // Apply borders to shift row
            for (let i = 2; i <= 6; i++) {
                shiftRow.getCell(i).border = borders;
            }
        });
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export default createExcel;
