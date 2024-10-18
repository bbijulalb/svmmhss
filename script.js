document.addEventListener('DOMContentLoaded', () => {
    const fileUpload = document.getElementById('fileUpload');
    const attendanceTable = document.getElementById('attendanceTable').getElementsByTagName('tbody')[0];
    const attendanceDate = document.getElementById('attendanceDate');
    const generateAbsentPDFButton = document.getElementById('generateAbsentPDF');
    const generatePresentPDFButton = document.getElementById('generatePresentPDF');

    // Set the date input to today's date
    const currentDate = new Date();
    attendanceDate.value = currentDate.toISOString().split('T')[0];

    // Parse the uploaded XLSX file and load student list into the table
    fileUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                // Find the index of the "name" column
                const headerRow = jsonData[0];
                const nameColumnIndex = headerRow.findIndex(col => col.toLowerCase() === 'name');

                if (nameColumnIndex === -1) {
                    alert("The uploaded file does not contain a 'name' column.");
                    return;
                }

                // Clear previous table data
                attendanceTable.innerHTML = '';
                jsonData.slice(1).forEach((row, index) => {
                    const studentName = row[nameColumnIndex];
                    if (studentName) {
                        const rowElement = attendanceTable.insertRow();
                        rowElement.innerHTML = `
                            <td>${index + 1}</td>
                            <td>${studentName}</td>
                            <td>
                                <label>
                                    <input type="radio" name="attendance${index}" value="Present" data-student="${studentName}" class="attendance-radio" checked> Present
                                </label>
                                <label>
                                    <input type="radio" name="attendance${index}" value="Absent" data-student="${studentName}" class="attendance-radio"> Absent
                                </label>
                            </td>
                        `;
                    }
                });
            };
            reader.readAsArrayBuffer(file);
        }
    });

    // Generate PDF report with only "Absent" students
    generateAbsentPDFButton.addEventListener('click', () => {
        generatePDFReport("Absent");
    });

    // Generate PDF report with only "Present" students
    generatePresentPDFButton.addEventListener('click', () => {
        generatePDFReport("Present");
    });

    // Function to generate a PDF report based on the status filter
    function generatePDFReport(statusFilter) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        const date = new Date(attendanceDate.value).toLocaleDateString();
        const time = currentDate.toLocaleTimeString();

        // Add heading and date/time in bold
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text("SVM MODEL HIGHER SECONDARY SCHOOL", 10, 20);
        pdf.setFontSize(12);
        pdf.text(`Date: ${date}`, 10, 30);
        pdf.text(`Time: ${time}`, 150, 30, { align: "right" });

        // Prepare table data based on the status filter (Present/Absent)
        const tableData = [];
        const radioButtons = document.querySelectorAll('.attendance-radio:checked');
        radioButtons.forEach((radio, index) => {
            const studentName = radio.getAttribute('data-student');
            const status = radio.value;
            if (status === statusFilter) {
                tableData.push([index + 1, studentName, status]);
            }
        });

        if (tableData.length === 0) {
            alert(`No students marked as ${statusFilter}.`);
            return;
        }

        // Add table to PDF using autoTable
        pdf.autoTable({
            startY: 40,
            head: [['S.No', 'Student Name', 'Status']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
            styles: { fontSize: 10, cellPadding: 4 },
        });

        // Save the PDF
        pdf.save(`${statusFilter}_Students_Report_${date.replace(/\//g, '-')}.pdf`);
    }
});
