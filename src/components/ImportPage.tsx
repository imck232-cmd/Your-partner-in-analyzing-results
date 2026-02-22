/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'motion/react';
import { FileUp, FileSpreadsheet, AlertCircle, CheckCircle2, Download, Trash2, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';
import { StudentRecord } from '../types';

interface ImportPageProps {
  onDataLoaded: (data: StudentRecord[]) => void;
}

export default function ImportPage({ onDataLoaded }: ImportPageProps) {
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tableTitle, setTableTitle] = useState('معاينة البيانات المستوردة');

  const normalizeArabic = (str: string) => {
    return String(str || '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u065F]/g, '') // Remove Harakat (Tashkeel)
      .replace(/[^\u0621-\u064A0-9a-zA-Z]/g, '') // Remove everything except Arabic letters and numbers
      .replace(/\s+/g, '') // Remove all spaces for better matching
      .trim()
      .toLowerCase();
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        if (rawRows.length === 0) throw new Error('الملف فارغ');

        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
          const row = rawRows[i];
          if (row && row.some(cell => {
            const normalized = normalizeArabic(String(cell));
            return normalized.includes('اسم') || normalized.includes('رقم') || normalized.includes('id');
          })) {
            headerRowIndex = i;
            break;
          }
        }

        const headers = rawRows[headerRowIndex].map(h => String(h || '').trim());
        const jsonData = rawRows.slice(headerRowIndex + 1).map(row => {
          const obj: any = {};
          headers.forEach((header, i) => {
            if (header) obj[header] = row[i];
          });
          return obj;
        }).filter(row => {
          const hasName = Object.keys(row).some(k => normalizeArabic(k).includes('اسم') && row[k]);
          const hasId = Object.keys(row).some(k => (normalizeArabic(k).includes('رقم') || normalizeArabic(k).includes('id')) && row[k]);
          return hasName || hasId;
        });

        if (jsonData.length === 0) throw new Error('لم يتم العثور على بيانات صالحة');

        const firstRow = jsonData[0];
        const isWideFormat = !Object.keys(firstRow).some(k => {
          const nk = normalizeArabic(k);
          return nk.includes('اسم الماده') || nk.includes('الماده');
        });

        let mappedData: StudentRecord[] = [];

        if (isWideFormat) {
          const isMetadataKey = (key: string) => {
            const normalized = normalizeArabic(key);
            const metadataPatterns = [
              'studentid', 'رقم', 'id', 'رقمجلوس', 'كود', 'code',
              'studentname', 'اسم', 'الاسم', 'name', 'الطالب', 'الطالبه',
              'gradelevel', 'الصف', 'grade', 'المستوى',
              'classsection', 'الشعبه', 'الفصل', 'section', 'class', 'مجموعه',
              'term', 'الفصل الدراسي', 'الترم', 'فصل',
              'examtype', 'نوع الاختبار', 'الاختبار', 'نوع',
              'examdate', 'تاريخ الاختبار', 'التاريخ', 'تاريخ',
              'notes', 'ملاحظات', 'الملاحظات',
              'gender', 'الجنس', 'نوع',
              'teachername', 'اسم المعلم', 'المعلم',
              'teachercode', 'كود المعلم',
              'المعدل', 'النسبه', 'التقدير', 'الترتيب', 'average', 'percentage', 'rank', 'total', 'المجموع', 'مجموع'
            ];
            return metadataPatterns.some(p => {
              const np = normalizeArabic(p);
              return normalized.includes(np) || np.includes(normalized);
            });
          };

          jsonData.forEach((row, index) => {
            const studentIdKey = Object.keys(row).find(k => {
              const nk = normalizeArabic(k);
              return nk.includes('رقم') || nk.includes('id') || nk.includes('رقمجلوس') || nk.includes('كود') || nk.includes('رقمطالب');
            });
            const studentNameKey = Object.keys(row).find(k => {
              const nk = normalizeArabic(k);
              return nk.includes('اسم') || nk.includes('الاسم') || nk.includes('name') || nk.includes('طالب') || nk.includes('طالبه');
            });
            
            const studentId = String(studentIdKey ? row[studentIdKey] : `S${index}`).trim();
            const studentName = String(studentNameKey ? row[studentNameKey] : 'غير معروف').trim();
            
            // Other metadata with defaults
            const gradeLevel = 1;
            const classSection = 'أ';
            const term = 'الأول';
            const examType = 'نهائي';
            const examDate = new Date().toLocaleDateString();
            const notes = '';
            const gender = '';

            // Iterate over keys to find subjects
            Object.keys(row).forEach(key => {
              const trimmedKey = key.trim();
              if (!trimmedKey) return;
              
              const value = row[key];
              
              // If it's not a metadata key and has a numeric value, it's a subject
              if (!isMetadataKey(trimmedKey) && value !== undefined && value !== null && value !== '') {
                const score = Number(value);
                
                if (!isNaN(score)) {
                  const maxScore = score > 50 ? 100 : 50;
                  
                  mappedData.push({
                    student_id: studentId,
                    student_name: studentName,
                    grade_level: gradeLevel,
                    class_section: classSection,
                    term: term,
                    exam_type: examType,
                    exam_date: examDate,
                    subject_code: trimmedKey,
                    subject_name: trimmedKey,
                    score,
                    max_score: maxScore,
                    percentage: (score / maxScore) * 100,
                    weight: 1,
                    notes,
                    gender
                  });
                }
              }
            });
          });
        } else {
          // Long format handling with robust key detection
          mappedData = jsonData.map((row, index) => {
            const findKey = (patterns: string[]) => {
              return Object.keys(row).find(k => {
                const nk = normalizeArabic(k);
                return patterns.some(p => nk.includes(normalizeArabic(p)));
              });
            };

            const idKey = findKey(['رقم', 'id', 'رقمجلوس', 'كود', 'رقمطالب']);
            const nameKey = findKey(['اسم', 'الاسم', 'name', 'طالب', 'طالبه']);
            const subjectKey = findKey(['الماده', 'subject', 'المواد', 'ماده']);
            const scoreKey = findKey(['الدرجه', 'score', 'النتيجه', 'درجه', 'الدرجات']);
            const maxScoreKey = findKey(['العظمى', 'maxscore', 'نهايه', 'عظمى']);

            const score = Number(row[scoreKey || ''] || 0);
            const maxScore = Number(row[maxScoreKey || ''] || 100);
            
            return {
              student_id: String(row[idKey || ''] || `S${index}`).trim(),
              student_name: String(row[nameKey || ''] || 'غير معروف').trim(),
              grade_level: Number(row.grade_level || row['الصف'] || 1),
              class_section: String(row.class_section || row['الشعبة'] || 'أ').trim(),
              term: String(row.term || row['الفصل الدراسي'] || 'الأول').trim(),
              exam_type: String(row.exam_type || row['نوع الاختبار'] || 'نهائي').trim(),
              exam_date: String(row.exam_date || row['تاريخ الاختبار'] || new Date().toLocaleDateString()).trim(),
              subject_code: String(row.subject_code || row['كود المادة'] || 'GEN').trim(),
              subject_name: String(row[subjectKey || ''] || 'مادة عامة').trim(),
              score,
              max_score: maxScore,
              percentage: (score / maxScore) * 100,
              weight: Number(row.weight || row['الوزن'] || 1),
              teacher_name: row.teacher_name || row['اسم المعلم'],
              gender: row.gender || row['الجنس'],
              notes: row.notes || row['ملاحظات']
            };
          });
        }

        if (mappedData.length === 0) throw new Error('لم يتم العثور على بيانات صالحة');
        
        setPreview(mappedData);
      } catch (err) {
        setError('حدث خطأ أثناء قراءة الملف. تأكد من استخدام التنسيق الصحيح.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: false
  } as any);

  // Group preview data for display
  const groupedData = useMemo(() => {
    const students: Record<string, any> = {};
    const subjects = new Set<string>();

    preview.forEach(record => {
      if (!students[record.student_id]) {
        students[record.student_id] = {
          id: record.student_id,
          name: record.student_name,
          scores: {}
        };
      }
      students[record.student_id].scores[record.subject_name] = record.score;
      subjects.add(record.subject_name);
    });

    return {
      rows: Object.values(students),
      subjects: Array.from(subjects)
    };
  }, [preview]);

  const handleCellEdit = (studentId: string, field: 'id' | 'name' | string, value: string) => {
    setPreview(prev => {
      if (field === 'id') {
        return prev.map(r => r.student_id === studentId ? { ...r, student_id: value } : r);
      }
      if (field === 'name') {
        return prev.map(r => r.student_id === studentId ? { ...r, student_name: value } : r);
      }
      // It's a subject score
      return prev.map(r => {
        if (r.student_id === studentId && r.subject_name === field) {
          const numValue = Number(value) || 0;
          return { 
            ...r, 
            score: numValue,
            percentage: (numValue / r.max_score) * 100
          };
        }
        return r;
      });
    });
  };

  const handleHeaderEdit = (oldSubject: string, newSubject: string) => {
    if (!newSubject.trim()) return;
    setPreview(prev => prev.map(r => 
      r.subject_name === oldSubject ? { ...r, subject_name: newSubject, subject_code: newSubject } : r
    ));
  };

  const handleAddRow = () => {
    const newId = `NEW-${Date.now()}`;
    const subjects = groupedData.subjects;
    if (subjects.length === 0) {
      subjects.push('مادة جديدة');
    }
    
    const newRecords: StudentRecord[] = subjects.map(sub => ({
      student_id: newId,
      student_name: 'طالب جديد',
      grade_level: 1,
      class_section: 'أ',
      term: 'الأول',
      exam_type: 'نهائي',
      exam_date: new Date().toLocaleDateString(),
      subject_code: sub,
      subject_name: sub,
      score: 0,
      max_score: 100,
      percentage: 0,
      weight: 1,
      notes: '',
      gender: ''
    }));

    setPreview(prev => [...prev, ...newRecords]);
  };

  const handleAddSubject = () => {
    const newSubject = `مادة ${groupedData.subjects.length + 1}`;
    const studentIds = groupedData.rows.map(r => r.id);
    
    if (studentIds.length === 0) {
      // If no students, just add one student with this subject
      const newId = `NEW-${Date.now()}`;
      setPreview([{
        student_id: newId,
        student_name: 'طالب جديد',
        grade_level: 1,
        class_section: 'أ',
        term: 'الأول',
        exam_type: 'نهائي',
        exam_date: new Date().toLocaleDateString(),
        subject_code: newSubject,
        subject_name: newSubject,
        score: 0,
        max_score: 100,
        percentage: 0,
        weight: 1,
        notes: '',
        gender: ''
      }]);
      return;
    }

    const newRecords: StudentRecord[] = studentIds.map(sid => {
      const studentName = groupedData.rows.find(r => r.id === sid)?.name || 'غير معروف';
      return {
        student_id: sid,
        student_name: studentName,
        grade_level: 1,
        class_section: 'أ',
        term: 'الأول',
        exam_type: 'نهائي',
        exam_date: new Date().toLocaleDateString(),
        subject_code: newSubject,
        subject_name: newSubject,
        score: 0,
        max_score: 100,
        percentage: 0,
        weight: 1,
        notes: '',
        gender: ''
      };
    });

    setPreview(prev => [...prev, ...newRecords]);
  };

  const downloadTemplate = () => {
    const template = [
      {
        'رقم الطالب': '2910',
        'اســـم الطالب': 'اديبه نبيل عبدالواسع محمد علي',
        'قرأن وعلومة': 31,
        'تربية إسلامية': 27,
        'لغة عربية': 42,
        'لغة إنجليزية': 15,
        'رياضيات': 35,
        'كيمياء': 40,
        'فيزياء': 38,
        'احياء': 0,
        'ملاحظـــــــات': ''
      }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data_Entry");
    XLSX.writeFile(wb, "قالب_إدخال_الدرجات_الموحد.xlsx");
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={() => {
            const sampleData: any[] = [
              { id: '2910', name: 'اديبه نبيل عبدالواسع محمد علي', scores: { 'قرأن وعلومة': 31, 'تربية إسلامية': 27, 'لغة عربية': 42, 'لغة إنجليزية': 15, 'رياضيات': 35, 'كيمياء': 40, 'فيزياء': 38, 'احياء': 0 } },
              { id: '294', name: 'اروى صالح علي صالح شليل', scores: { 'قرأن وعلومة': 46, 'تربية إسلامية': 38, 'لغة عربية': 50, 'لغة إنجليزية': 30, 'رياضيات': 50, 'كيمياء': 50, 'فيزياء': 50, 'احياء': 49 } },
              { id: '302', name: 'اسماء محمد احمد علي الحبيشي', scores: { 'قرأن وعلومة': 33, 'تربية إسلامية': 31, 'لغة عربية': 40, 'لغة إنجليزية': 15, 'رياضيات': 35, 'كيمياء': 42, 'فيزياء': 46, 'احياء': 42 } },
              { id: '4190', name: 'الاء صادق حسين البطاحي', scores: { 'قرأن وعلومة': 42, 'تربية إسلامية': 0, 'لغة عربية': 48, 'لغة إنجليزية': 27, 'رياضيات': 45, 'كيمياء': 50, 'فيزياء': 45, 'احياء': 38 } },
              { id: '296', name: 'اية عصام محمد علي الشوافي', scores: { 'قرأن وعلومة': 44, 'تربية إسلامية': 42, 'لغة عربية': 50, 'لغة إنجليزية': 27, 'رياضيات': 48, 'كيمياء': 50, 'فيزياء': 50, 'احياء': 48 } },
              { id: '288', name: 'اية محمد محمد احمد الفقيه', scores: { 'قرأن وعلومة': 49, 'تربية إسلامية': 39, 'لغة عربية': 50, 'لغة إنجليزية': 27, 'رياضيات': 50, 'كيمياء': 50, 'فيزياء': 50, 'احياء': 48 } },
              { id: '1569', name: 'ايه محمد ثابت صالح السلامي', scores: { 'قرأن وعلومة': 24, 'تربية إسلامية': 26, 'لغة عربية': 42, 'لغة إنجليزية': 15, 'رياضيات': 30, 'كيمياء': 45, 'فيزياء': 46, 'احياء': 42 } },
              { id: '303', name: 'براءة حميد منصور علي العنز', scores: { 'قرأن وعلومة': 23, 'تربية إسلامية': 17, 'لغة عربية': 40, 'لغة إنجليزية': 12, 'رياضيات': 25, 'كيمياء': 40, 'فيزياء': 38, 'احياء': 0 } },
              { id: '4623', name: 'ترتيل حسن احمد عبدالله هيج', scores: { 'قرأن وعلومة': 21, 'تربية إسلامية': 39, 'لغة عربية': 46, 'لغة إنجليزية': 15, 'رياضيات': 38, 'كيمياء': 50, 'فيزياء': 48, 'احياء': 42 } },
              { id: '291', name: 'خلود وليد محمد احمد العفيف', scores: { 'قرأن وعلومة': 34, 'تربية إسلامية': 27, 'لغة عربية': 42, 'لغة إنجليزية': 15, 'رياضيات': 30, 'كيمياء': 40, 'فيزياء': 42, 'احياء': 0 } },
              { id: '286', name: 'دعاء رشاد صدقي محمد العمراني', scores: { 'قرأن وعلومة': 35, 'تربية إسلامية': 22, 'لغة عربية': 45, 'لغة إنجليزية': 17, 'رياضيات': 43, 'كيمياء': 46, 'فيزياء': 46, 'احياء': 0 } },
              { id: '2490', name: 'رؤيا خالد عبدالله حزام الصرمي', scores: { 'قرأن وعلومة': 24, 'تربية إسلامية': 24, 'لغة عربية': 46, 'لغة إنجليزية': 17, 'رياضيات': 32, 'كيمياء': 40, 'فيزياء': 46, 'احياء': 40 } },
              { id: '4024', name: 'رانيا احمد محمد عبده الطلحه', scores: { 'قرأن وعلومة': 20, 'تربية إسلامية': 0, 'لغة عربية': 47, 'لغة إنجليزية': 17, 'رياضيات': 36, 'كيمياء': 40, 'فيزياء': 38, 'احياء': 0 } },
              { id: '308', name: 'ربى حمدي علي محمد العبسي', scores: { 'قرأن وعلومة': 25, 'تربية إسلامية': 0, 'لغة عربية': 46, 'لغة إنجليزية': 20, 'رياضيات': 34, 'كيمياء': 50, 'فيزياء': 45, 'احياء': 0 } },
              { id: '287', name: 'ربى عبدالعزيز عبيد علي الاهدل', scores: { 'قرأن وعلومة': 0, 'تربية إسلامية': 0, 'لغة عربية': 0, 'لغة إنجليزية': 0, 'رياضيات': 0, 'كيمياء': 0, 'فيزياء': 0, 'احياء': 0 } },
              { id: '290', name: 'ربى محمد عوض علي المصباحي', scores: { 'قرأن وعلومة': 43, 'تربية إسلامية': 23, 'لغة عربية': 42, 'لغة إنجليزية': 19, 'رياضيات': 32, 'كيمياء': 50, 'فيزياء': 46, 'احياء': 0 } },
              { id: '1977', name: 'رغد عبده ابراهيم عبده الوصابي', scores: { 'قرأن وعلومة': 40, 'تربية إسلامية': 0, 'لغة عربية': 45, 'لغة إنجليزية': 25, 'رياضيات': 48, 'كيمياء': 50, 'فيزياء': 50, 'احياء': 42 } },
              { id: '2084', name: 'رفيف محسن حسن محمد عبدالله', scores: { 'قرأن وعلومة': 39, 'تربية إسلامية': 28, 'لغة عربية': 42, 'لغة إنجليزية': 22, 'رياضيات': 38, 'كيمياء': 46, 'فيزياء': 46, 'احياء': 42 } },
              { id: '1498', name: 'رنده عبده محمد نصر الجرفي', scores: { 'قرأن وعلومة': 40, 'تربية إسلامية': 0, 'لغة عربية': 49, 'لغة إنجليزية': 22, 'رياضيات': 45, 'فيزياء': 48, 'احياء': 0 } },
              { id: '299', name: 'رهف بندر حمود قايد الحرازي', scores: { 'قرأن وعلومة': 44, 'تربية إسلامية': 31, 'لغة عربية': 48, 'لغة إنجليزية': 20, 'رياضيات': 45, 'كيمياء': 50, 'فيزياء': 50, 'احياء': 46 } },
              { id: '3860', name: 'ريتاج احمد محمد حسن الاحلسي', scores: { 'قرأن وعلومة': 32, 'تربية إسلامية': 0, 'لغة عربية': 42, 'لغة إنجليزية': 16, 'رياضيات': 25, 'كيمياء': 40, 'فيزياء': 40, 'احياء': 0 } },
              { id: '1803', name: 'ريماس مهند محفوظ محمد غالب', scores: { 'قرأن وعلومة': 28, 'تربية إسلامية': 0, 'لغة عربية': 43, 'لغة إنجليزية': 15, 'رياضيات': 25, 'كيمياء': 42, 'فيزياء': 46, 'احياء': 0 } },
              { id: '4018', name: 'زينب محي الدين شمسان قحطان القاسم', scores: { 'قرأن وعلومة': 32, 'تربية إسلامية': 0, 'لغة عربية': 45, 'لغة إنجليزية': 22, 'رياضيات': 50, 'كيمياء': 50, 'فيزياء': 50, 'احياء': 0 } },
              { id: '3919', name: 'شهد عبدالله محمد الحكمي', scores: { 'قرأن وعلومة': 44, 'تربية إسلامية': 0, 'لغة عربية': 50, 'لغة إنجليزية': 30, 'رياضيات': 50, 'كيمياء': 50, 'فيزياء': 50, 'احياء': 48 } },
              { id: '316', name: 'لمياء طارق شرف علي القليصي', scores: { 'قرأن وعلومة': 23, 'تربية إسلامية': 0, 'لغة عربية': 43, 'لغة إنجليزية': 16, 'رياضيات': 25, 'كيمياء': 42, 'فيزياء': 40, 'احياء': 36 } },
              { id: '3467', name: 'ماريا فواز هادي صالح الجالدي', scores: { 'قرأن وعلومة': 25, 'تربية إسلامية': 19, 'لغة عربية': 40, 'لغة إنجليزية': 12, 'رياضيات': 25, 'كيمياء': 40, 'فيزياء': 42, 'احياء': 0 } },
              { id: '1759', name: 'مرام طه عبدالرقيب الرجبي', scores: { 'قرأن وعلومة': 35, 'تربية إسلامية': 27, 'لغة عربية': 44, 'لغة إنجليزية': 19, 'رياضيات': 28, 'كيمياء': 46, 'فيزياء': 46, 'احياء': 42 } },
              { id: '644', name: 'مرام ماجد احمد عبده الشبيبي', scores: { 'قرأن وعلومة': 29, 'تربية إسلامية': 0, 'لغة عربية': 43, 'لغة إنجليزية': 15, 'رياضيات': 25, 'كيمياء': 40, 'فيزياء': 38, 'احياء': 0 } },
              { id: '300', name: 'ملاك احمد حسين العروسي', scores: { 'تربية إسلامية': 0, 'لغة إنجليزية': 13, 'رياضيات': 25, 'كيمياء': 42, 'فيزياء': 35, 'احياء': 0 } },
              { id: '4231', name: 'ملاك صادق محمد عبده الشلفي', scores: { 'قرأن وعلومة': 29, 'تربية إسلامية': 36, 'لغة عربية': 45, 'لغة إنجليزية': 15, 'رياضيات': 30, 'كيمياء': 46, 'فيزياء': 40, 'احياء': 42 } },
              { id: '298', name: 'ملاك يحيى علي صالح مخارش', scores: { 'قرأن وعلومة': 30, 'تربية إسلامية': 28, 'لغة عربية': 47, 'لغة إنجليزية': 16, 'رياضيات': 40, 'كيمياء': 48, 'فيزياء': 45, 'احياء': 0 } },
              { id: '2628', name: 'ملاك يحيى محمد الهمداني', scores: { 'قرأن وعلومة': 16, 'تربية إسلامية': 22, 'لغة عربية': 40, 'لغة إنجليزية': 15, 'رياضيات': 25, 'كيمياء': 40, 'فيزياء': 35, 'احياء': 0 } },
              { id: '1021', name: 'منار عمار احمد صالح القحطاني', scores: { 'قرأن وعلومة': 30, 'تربية إسلامية': 36, 'لغة عربية': 50, 'لغة إنجليزية': 25, 'رياضيات': 45, 'كيمياء': 50, 'فيزياء': 50, 'احياء': 0 } },
              { id: '1343', name: 'ندى علي nacer علي الرحبي', scores: { 'قرأن وعلومة': 0, 'تربية إسلامية': 21, 'لغة عربية': 40, 'لغة إنجليزية': 12, 'رياضيات': 35, 'كيمياء': 42, 'فيزياء': 46, 'احياء': 48 } },
              { id: '3728', name: 'نقية محمد شايف عبدالله العليمي', scores: { 'قرأن وعلومة': 21, 'تربية إسلامية': 0, 'لغة عربية': 42, 'لغة إنجليزية': 20, 'رياضيات': 25, 'كيمياء': 42, 'فيزياء': 48, 'احياء': 0 } },
              { id: '297', name: 'نهى محمد منصور علي الشوافي', scores: { 'قرأن وعلومة': 40, 'تربية إسلامية': 41, 'لغة عربية': 50, 'لغة إنجليزية': 29, 'رياضيات': 50, 'كيمياء': 50, 'فيزياء': 50, 'احياء': 48 } },
              { id: '4866', name: 'نور هشام علي حسين شرهان', scores: { 'قرأن وعلومة': 0, 'تربية إسلامية': 0, 'لغة عربية': 0, 'لغة إنجليزية': 12, 'رياضيات': 0, 'كيمياء': 0, 'فيزياء': 0, 'احياء': 0 } },
              { id: '4564', name: 'نورا احمد عبدالله الجدري', scores: { 'قرأن وعلومة': 0, 'تربية إسلامية': 0, 'لغة عربية': 43, 'لغة إنجليزية': 12, 'رياضيات': 0, 'كيمياء': 0, 'فيزياء': 0, 'احياء': 0 } },
              { id: '315', name: 'هبة ابراهيم علي احمد فاتق', scores: { 'قرأن وعلومة': 46, 'تربية إسلامية': 34, 'لغة عربية': 48, 'لغة إنجليزية': 20, 'رياضيات': 47, 'كيمياء': 50, 'فيزياء': 50, 'احياء': 0 } },
              { id: '2695', name: 'ياسمين حمدي عبدالملك الشيباني', scores: { 'قرأن وعلومة': 48, 'تربية إسلامية': 33, 'لغة عربية': 46, 'لغة إنجليزية': 26, 'رياضيات': 45, 'كيمياء': 50, 'فيزياء': 50, 'احياء': 48 } }
            ];

            const mapped: StudentRecord[] = [];
            sampleData.forEach(s => {
              Object.entries(s.scores).forEach(([subject, score]) => {
                const numScore = Number(score);
                const maxScore = numScore > 50 ? 100 : 50;
                mapped.push({
                  student_id: s.id,
                  student_name: s.name,
                  grade_level: 1,
                  class_section: 'أ',
                  term: 'الأول',
                  exam_type: 'نهائي',
                  exam_date: new Date().toLocaleDateString(),
                  subject_code: subject,
                  subject_name: subject,
                  score: numScore,
                  max_score: maxScore,
                  percentage: (numScore / maxScore) * 100,
                  weight: 1,
                  notes: '',
                  gender: ''
                });
              });
            });
            setPreview(mapped);
          }}
          className="glass-card p-6 flex items-center justify-center gap-3 hover:bg-white/10 transition-all group"
        >
          <Sparkles className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
          <div className="text-right">
            <p className="font-bold">تحميل بيانات تجريبية</p>
            <p className="text-xs text-slate-400">استخدم بيانات الـ 40 طالبة المرفقة كمثال</p>
          </div>
        </button>

        <button 
          onClick={downloadTemplate}
          className="glass-card p-6 flex items-center justify-center gap-3 hover:bg-white/10 transition-all group"
        >
          <Download className="w-6 h-6 text-accent-purple group-hover:scale-110 transition-transform" />
          <div className="text-right">
            <p className="font-bold">تحميل القالب الموحد</p>
            <p className="text-xs text-slate-400">تحميل ملف Excel فارغ لإدخال بياناتك</p>
          </div>
        </button>
      </div>
      <div 
        {...getRootProps()} 
        className={`glass-card p-12 border-dashed border-2 transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 ${
          isDragActive ? 'border-accent-purple bg-accent-purple/5' : 'border-white/10 hover:border-white/20'
        }`}
      >
        <input {...getInputProps()} />
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
          <FileUp className={`w-10 h-10 ${isDragActive ? 'text-accent-purple' : 'text-slate-400'}`} />
        </div>
        <div className="text-center">
          <p className="text-xl font-bold">اسحب الملف هنا أو اضغط للاختيار</p>
          <p className="text-slate-400 mt-1">يدعم ملفات Excel (xlsx, xls) و CSV</p>
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400"
        >
          <AlertCircle className="w-6 h-6" />
          <p>{error}</p>
        </motion.div>
      )}

      {preview.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <CheckCircle2 className="text-emerald-400 w-5 h-5 flex-shrink-0" />
                <input 
                  type="text"
                  value={tableTitle}
                  onChange={(e) => setTableTitle(e.target.value)}
                  className="bg-transparent border-b border-white/10 focus:border-accent-purple outline-none font-bold text-lg w-full"
                  placeholder="عنوان الجدول..."
                />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleAddRow}
                  className="p-2 bg-accent-purple/10 text-accent-purple hover:bg-accent-purple hover:text-white rounded-lg transition-all text-xs font-bold flex items-center gap-1"
                >
                  <Sparkles className="w-4 h-4" />
                  إضافة طالب
                </button>
                <button 
                  onClick={handleAddSubject}
                  className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all text-xs font-bold flex items-center gap-1"
                >
                  <FileUp className="w-4 h-4" />
                  إضافة مادة
                </button>
                <button 
                  onClick={() => setPreview([])}
                  className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-white/5 text-slate-400 text-sm">
                  <tr>
                    <th className="p-4 min-w-[120px]">رقم الطالب</th>
                    <th className="p-4 min-w-[200px]">اســـم الطالب</th>
                    {groupedData.subjects.map(subject => (
                      <th key={subject} className="p-4 min-w-[100px]">
                        <input 
                          type="text"
                          value={subject}
                          onChange={(e) => handleHeaderEdit(subject, e.target.value)}
                          className="bg-transparent border-none focus:ring-1 focus:ring-accent-purple outline-none text-center w-full font-bold text-slate-200"
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {groupedData.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="p-2">
                        <input 
                          type="text"
                          value={row.id}
                          onChange={(e) => handleCellEdit(row.id, 'id', e.target.value)}
                          className="bg-transparent border-none focus:ring-1 focus:ring-accent-purple outline-none w-full p-2 font-mono text-sm"
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="text"
                          value={row.name}
                          onChange={(e) => handleCellEdit(row.id, 'name', e.target.value)}
                          className="bg-transparent border-none focus:ring-1 focus:ring-accent-purple outline-none w-full p-2"
                        />
                      </td>
                      {groupedData.subjects.map(subject => (
                        <td key={subject} className="p-2">
                          <input 
                            type="number"
                            value={row.scores[subject] !== undefined ? row.scores[subject] : ''}
                            onChange={(e) => handleCellEdit(row.id, subject, e.target.value)}
                            className="bg-transparent border-none focus:ring-1 focus:ring-accent-purple outline-none w-full p-2 text-center"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button 
            onClick={() => onDataLoaded(preview)}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            تأكيد البيانات وبدء التحليل
          </button>
        </motion.div>
      )}
    </div>
  );
}
