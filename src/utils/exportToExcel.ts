import * as XLSX from 'xlsx';
import { Meeting, Speaker } from '../types';
import { getSpeechTypeById } from '../data/speechTypes';
import { formatTime } from './formatTime';

export function exportToExcel(meeting: Meeting) {
  const data = meeting.speakers.map((speaker: Speaker) => {
    const speechType = getSpeechTypeById(speaker.speechTypeId);
    return {
      'Speaker Name': speaker.name,
      'Speech Type': speechType?.name ?? speaker.speechTypeId,
      'Time': speaker.elapsedTime != null ? formatTime(speaker.elapsedTime) : '—',
      'Time (seconds)': speaker.elapsedTime ?? '',
      'Status': speaker.statusAtStop ?? '—',
      'Completed': speaker.completed ? 'Yes' : 'No',
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // Speaker Name
    { wch: 25 }, // Speech Type
    { wch: 10 }, // Time
    { wch: 15 }, // Time (seconds)
    { wch: 10 }, // Status
    { wch: 10 }, // Completed
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Timer Results');

  // Add a metadata sheet
  const metaData = [
    { Field: 'Meeting Title', Value: meeting.title },
    { Field: 'Date', Value: meeting.date },
    { Field: 'Total Speakers', Value: meeting.speakers.length.toString() },
    { Field: 'Completed', Value: meeting.speakers.filter((s) => s.completed).length.toString() },
  ];
  const metaWs = XLSX.utils.json_to_sheet(metaData);
  metaWs['!cols'] = [{ wch: 18 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, metaWs, 'Meeting Info');

  const fileName = `ToastmasterTimer_${meeting.date.replace(/\//g, '-')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
