const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('tmp-study-plan.pdf'));

doc.fontSize(16).text('King Saud University', 100, 80);
doc.fontSize(14).text('College of Engineering - Computer Science Department', 100, 110);
doc.fontSize(12).text('Academic Year: 2026-2027', 100, 140);
doc.fontSize(12).text('Total Credits: 120', 100, 160);

doc.fontSize(14).text('First Year - Semester 1', 100, 200);
doc.fontSize(10).text('CS101 - Introduction to Computer Science - 3 credit hours', 100, 230);
doc.fontSize(10).text('MATH101 - Calculus I - 3 credit hours', 100, 250);

doc.fontSize(14).text('First Year - Semester 2', 100, 290);
doc.fontSize(10).text('CS102 - Programming Fundamentals - 3 credit hours (Prereq: CS101)', 100, 320);

doc.fontSize(14).text('Second Year - Semester 1', 100, 360);
doc.fontSize(10).text('CS201 - Data Structures - 3 credit hours (Prereq: CS102)', 100, 390);
doc.fontSize(10).text('ELECTIVE - University Elective - 2 credit hours', 100, 410);

doc.end();
console.log('Created tmp-study-plan.pdf');
