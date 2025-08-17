// CMML Market Scan - Enhanced Frontend JavaScript with Dual Analysis

class CMMLApp {
    constructor() {
        this.form = document.getElementById('analysisForm');
        this.fileInput = document.getElementById('pdfFile');
        this.fileDisplay = document.querySelector('.file-input-display');
        this.fileText = document.querySelector('.file-text');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        
        // Advanced options
        this.toggleAdvanced = document.getElementById('toggleAdvanced');
        this.advancedContent = document.getElementById('advancedContent');
        this.marketPrompt = document.getElementById('marketPrompt');
        this.documentPrompt = document.getElementById('documentPrompt');
        this.compliancePrompt = document.getElementById('compliancePrompt');
        this.resetPrompts = document.getElementById('resetPrompts');
        
        // Sections
        this.uploadSection = document.querySelector('.upload-section');
        this.loadingSection = document.getElementById('loadingSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.errorSection = document.getElementById('errorSection');
        
        // Result elements
        this.resultCompany = document.getElementById('resultCompany');
        this.unifiedReportContent = document.getElementById('unifiedReportContent');
        this.errorMessage = document.getElementById('errorMessage');
        
        // Buttons
        this.downloadBtn = document.getElementById('downloadBtn');
        this.downloadOptions = document.getElementById('downloadOptions');
        this.downloadPdf = document.getElementById('downloadPdf');
        this.downloadWord = document.getElementById('downloadWord');
        this.downloadText = document.getElementById('downloadText');
        this.newAnalysisBtn = document.getElementById('newAnalysisBtn');
        this.retryBtn = document.getElementById('retryBtn');
        
        this.currentAnalysis = null;
        
        // Default prompts
        this.defaultPrompts = this.getDefaultPrompts();
        
        this.init();
    }
    
    getDefaultPrompts() {
        return {
            marketResearch: `Please provide a concise and comprehensive overview of **[Company Name]** and the industry in which it operates, based on information from its official website and general industry analysis.

**Part 1: Company Overview**

*   **Company Establishment:** When was the company founded?
*   **Core Business:** What is the primary business of the company?
*   **Products/Services:** What are the key products or services offered?

**Part 2: Industry Overview**

*   **Brief about Industry:** What is the nature of the industry in which the company operates?
*   **Past/Future Trends:** What are the significant past and future trends that one should be watchful of?
*   **Industry Volatility:** How volatile is the industry, and what factors contribute to its stability or instability?`,
            
            documentAnalysis: `Comprehensive Analysis of Company Report for CMML Team 

Objective: Your task is to conduct a thorough analysis of the provided company report. Extract and structure key information regarding the company's leadership, financial health, and ownership structure as detailed below. The final output should be presented in clear, well-formatted markdown tables for review by the CMML team. Accuracy is the most important.

Part 1: Board of Directors Analysis 
Instructions:
1. Identify Active Directors: From the "Directors" section of the report, compile a list of all individuals currently designated as active directors. Exclude any individuals listed with a "Cessation Date."
2. Extract and Summarize: For each active director identified, extract the required information and create a concise, one-sentence summary of their professional background or key affiliations, based only on the information available within the report (e.g., "Other Directorships/Partnerships" and biographical sections).
3. Format Output Table: Present the extracted information in a single markdown table with the following columns:
   - Full Name
   - Designation
   - Date of Appointment
   - DIN
   - Summary of Experience

Part 2: Credit Rating History Analysis 
Instructions:
1. Categorize by Agency: Create a separate section and table for each credit rating agency mentioned in the report (e.g., CRISIL, India Ratings, CARE, ICRA).
2. Extract Rating History (Last 5-7 Years): For each rating agency, extract the following details for all rating actions within the last 5 to 7 years and share in descending order:
   - Month & Year: The month and financial year of the rating (e.g., Jan - 25).
   - Credit Rating: The specific rating assigned (Only single rating shall be mentioned)
   - Outlook: The associated outlook (e.g., Stable, Positive, Negative or something else). If none is provided, use "-".
3. Filter for Changes: If a rating agency has issued multiple ratings within the same financial year, include only the entries where there has been a change in either the Credit Rating or the Outlook. Ignore entries where both remain unchanged from the previous entry in that same year.
4. Generate Rationale Summary: For each rating entry you list, provide a brief, one- to two-line summary explaining the key drivers behind the rating decision as stated in the report. This summary must be specific.
5. Format Output Tables: Present the information in separate markdown tables for each rating agency, using the following columns:
   - Month & Financial Year
   - Credit Rating
   - Outlook
   - Generated Rationale

Part 3: Key Financial Performance Analysis 
Instructions:
1. Extract Financial Metrics: From the financial statements in the report, extract the following key metrics for the last 3 to 4 financial years. If there are 4 years available then must capture for 4. Data should only be mentioned if available and clearly established. The data is available in "5.FINANCIALS" in the report:
   - Revenue from Operations
   - EBITDA (Earnings Before Interest, Taxes, Depreciation, and Amortization)
   - Profit After Tax (PAT)
   - Net Worth
   - Total Debt (sum of long-term and short-term debt)
2. Handle Missing Data: If a specific metric is not available for a given year, clearly mark it as NA in the table.
3. Format as a Table: Present the data in a single markdown table with financial years as columns and metrics as rows to facilitate easy year-over-year comparison.

Company Name: [Company Name]`,

            complianceAnalysis: `As an analyst for the CMML lending team, please conduct an internet-based analysis for the following company and provide a brief and concise summary of your findings:

**Company:** [Company Name]

**I. Compliance Checks:**

*   **Wilful Defaulter Status:** Is the company or its directors/promoters listed as wilful defaulters?
*   **CIBIL Remarks:** Are there any adverse remarks in the CIBIL reports for the company and its directors/promoters?
*   **Statutory Dues:** Are there any reported delays in GST or EPFO payments?
*   **Auditor's Opinion:** Have the auditors made any adverse remarks in the company's financial reports?
*   **Legal Proceedings:** Are there any significant pending legal cases against the company or its directors?
    *(Please prioritize information sourced from Corpository where available)*

**II. News & Media Scan:**

*   **General Hygiene:** What is the general sentiment or reputation of the company based on recent news?
*   **Articles & Coverage:** Are there any notable recent news articles or media coverage concerning the company or its promoters?
*   **Corporate Announcements:** What are the latest corporate announcements made by the company on the BSE/NSE portals?`
        };
    }
    
    init() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // File input changes
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Advanced options toggle
        this.toggleAdvanced.addEventListener('click', () => this.toggleAdvancedOptions());
        
        // Reset prompts
        this.resetPrompts.addEventListener('click', () => this.resetToDefaultPrompts());
        
        // Drag and drop
        this.setupDragAndDrop();
        
        // Button handlers
        this.downloadBtn.addEventListener('click', () => this.toggleDownloadDropdown());
        this.downloadPdf.addEventListener('click', () => this.downloadAsPdf());
        this.downloadWord.addEventListener('click', () => this.downloadAsWord());
        this.downloadText.addEventListener('click', () => this.downloadAsText());
        this.newAnalysisBtn.addEventListener('click', () => this.resetForm());
        this.retryBtn.addEventListener('click', () => this.resetForm());
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
        
        // Load default prompts
        this.resetToDefaultPrompts();
        
        console.log('CMML Market Scan v3.0 initialized - Triple Intelligence Engine');
    }
    
    toggleAdvancedOptions() {
        const isHidden = this.advancedContent.style.display === 'none';
        this.advancedContent.style.display = isHidden ? 'block' : 'none';
        this.toggleAdvanced.textContent = isHidden ? '⚙️ Hide Custom Prompts' : '⚙️ Customize Analysis Prompts';
        
        if (isHidden) {
            this.advancedContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    resetToDefaultPrompts() {
        this.marketPrompt.value = this.defaultPrompts.marketResearch;
        this.documentPrompt.value = this.defaultPrompts.documentAnalysis;
        this.compliancePrompt.value = this.defaultPrompts.complianceAnalysis;
    }
    
    setupDragAndDrop() {
        const wrapper = document.querySelector('.file-input-wrapper');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            wrapper.addEventListener(eventName, this.preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            wrapper.addEventListener(eventName, () => {
                wrapper.classList.add('dragover');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            wrapper.addEventListener(eventName, () => {
                wrapper.classList.remove('dragover');
            }, false);
        });
        
        wrapper.addEventListener('drop', (e) => this.handleDrop(e), false);
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'application/pdf') {
                this.fileInput.files = files;
                this.updateFileDisplay(file.name);
            } else {
                this.showError('Please drop a PDF file');
            }
        }
    }
    
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.updateFileDisplay(file.name);
        }
    }
    
    updateFileDisplay(filename) {
        this.fileText.textContent = `Selected: ${filename}`;
        this.fileDisplay.style.borderColor = '#059669';
        this.fileDisplay.style.backgroundColor = '#ecfdf5';
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        
        // Validation
        if (!formData.get('company_name').trim()) {
            this.showError('Please enter a company name');
            return;
        }
        
        if (!formData.get('pdf_file') || !formData.get('pdf_file').name) {
            this.showError('Please select a PDF file');
            return;
        }
        
        try {
            this.showLoading();
            
            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showResults(result);
            } else {
                this.showError(result.error || 'Analysis failed');
            }
            
        } catch (error) {
            console.error('Error:', error);
            this.showError('Network error. Please check your connection and try again.');
        }
    }
    
    showLoading() {
        this.analyzeBtn.disabled = true;
        this.analyzeBtn.classList.add('loading');
        
        this.uploadSection.style.display = 'none';
        this.resultsSection.style.display = 'none';
        this.errorSection.style.display = 'none';
        this.loadingSection.style.display = 'block';
    }
    
    showResults(result) {
        this.currentAnalysis = result;
        
        this.resultCompany.textContent = result.company_name;
        
        // Create unified report content in the correct order without section headings
        let unifiedContent = '';
        
        // 1. Market Research - First Priority
        if (result.market_research) {
            unifiedContent += `<div class="report-content">${this.convertMarkdownToHtml(result.market_research)}</div>`;
        }
        
        // 2. Document Analysis (PDF Analysis) - Second Priority  
        if (result.pdf_analysis) {
            unifiedContent += `<div class="report-content">${this.convertMarkdownToHtml(result.pdf_analysis)}</div>`;
        }
        
        // 3. Compliance Analysis - Third Priority
        if (result.compliance_analysis) {
            unifiedContent += `<div class="report-content">${this.convertMarkdownToHtml(result.compliance_analysis)}</div>`;
        }
        
        // If no content, show message
        if (!unifiedContent) {
            unifiedContent = '<div class="no-data">No analysis results available</div>';
        }
        
        // Set the unified content
        this.unifiedReportContent.innerHTML = unifiedContent;
        
        this.loadingSection.style.display = 'none';
        this.resultsSection.style.display = 'block';
        this.resultsSection.classList.add('show');
        
        // Scroll to results
        this.resultsSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
    
    convertMarkdownToHtml(markdown) {
        if (!markdown) return '<p><em>No data available</em></p>';
        
        let html = markdown;
        
        // Convert headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Convert bold text
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Convert italic text
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Convert code blocks
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // Convert inline code
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // Convert tables (simple markdown table support)
        html = html.replace(/\|(.+)\|/g, (match, content) => {
            const cells = content.split('|').map(cell => cell.trim());
            const cellTags = cells.map(cell => `<td>${cell}</td>`).join('');
            return `<tr>${cellTags}</tr>`;
        });
        
        // Wrap tables
        html = html.replace(/(<tr>.*<\/tr>)/gs, '<table class="markdown-table">$1</table>');
        
        // Convert unordered lists
        html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
        html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
        
        // Convert numbered lists
        html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
        
        // Wrap consecutive list items in ul tags
        html = html.replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)*/gs, '<ul>$&</ul>');
        
        // Convert line breaks to <br> and paragraphs
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        
        // Wrap in paragraphs if not already wrapped
        if (!html.startsWith('<')) {
            html = '<p>' + html + '</p>';
        }
        
        // Clean up any double paragraph tags
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p><br>/g, '<p>');
        
        return html;
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
        
        this.loadingSection.style.display = 'none';
        this.resultsSection.style.display = 'none';
        this.errorSection.style.display = 'block';
        
        this.resetButton();
    }
    
    resetButton() {
        this.analyzeBtn.disabled = false;
        this.analyzeBtn.classList.remove('loading');
    }
    
    resetForm() {
        // Reset form
        this.form.reset();
        
        // Reset file display
        this.fileText.textContent = 'Choose PDF file or drag & drop';
        this.fileDisplay.style.borderColor = '#d1d5db';
        this.fileDisplay.style.backgroundColor = '#f9fafb';
        
        // Reset advanced options
        this.advancedContent.style.display = 'none';
        this.toggleAdvanced.textContent = '⚙️ Customize Analysis Prompts';
        this.resetToDefaultPrompts();
        
        // Reset button
        this.resetButton();
        
        // Show upload section
        this.uploadSection.style.display = 'block';
        this.loadingSection.style.display = 'none';
        this.resultsSection.style.display = 'none';
        this.errorSection.style.display = 'none';
        
        // Clear analysis data
        this.currentAnalysis = null;
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    toggleDownloadDropdown() {
        if (this.downloadOptions.classList.contains('show')) {
            this.downloadOptions.classList.remove('show');
        } else {
            this.downloadOptions.classList.add('show');
        }
    }
    
    handleOutsideClick(e) {
        if (!this.downloadBtn.contains(e.target) && !this.downloadOptions.contains(e.target)) {
            this.downloadOptions.classList.remove('show');
        }
    }
    
    async downloadAsPdf() {
        this.downloadOptions.classList.remove('show');
        
        if (!this.currentAnalysis) {
            this.showError('No analysis data available for download');
            return;
        }
        
        try {
            // Show loading state
            this.downloadPdf.textContent = '⏳ Generating PDF...';
            this.downloadPdf.disabled = true;
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Set font and colors
            doc.setFont('helvetica');
            
            // Header
            doc.setFontSize(20);
            doc.setTextColor(102, 126, 234); // Brand color
            doc.text('CMML Market Scan - Triple Intelligence Report', 20, 25);
            
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Company: ${this.currentAnalysis.company_name}`, 20, 35);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 42);
            
            // Add line
            doc.setDrawColor(229, 231, 235);
            doc.line(20, 48, 190, 48);
            
            let yPosition = 60;
            
            // Market Research Section
            if (this.currentAnalysis.market_research) {
                yPosition = this.addPdfSection(doc, '🔍 Market Research & Industry Analysis', this.currentAnalysis.market_research, yPosition);
            }
            
            // Document Analysis Section
            if (this.currentAnalysis.pdf_analysis) {
                yPosition = this.addPdfSection(doc, '📊 Document Analysis (CMML Team)', this.currentAnalysis.pdf_analysis, yPosition);
            }
            
            // Compliance Analysis Section
            if (this.currentAnalysis.compliance_analysis) {
                yPosition = this.addPdfSection(doc, '⚖️ Compliance & Due Diligence Analysis', this.currentAnalysis.compliance_analysis, yPosition);
            }
            
            // Save PDF
            const filename = `${this.currentAnalysis.company_name.replace(/[^a-z0-9]/gi, '_')}_triple_analysis_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);
            
            this.showDownloadSuccess('PDF downloaded successfully!');
            
        } catch (error) {
            console.error('PDF generation error:', error);
            this.showError('Failed to generate PDF. Please try again.');
        } finally {
            // Reset button
            this.downloadPdf.textContent = '📄 Download as PDF';
            this.downloadPdf.disabled = false;
        }
    }
    
    async downloadAsWord() {
        this.downloadOptions.classList.remove('show');
        
        if (!this.currentAnalysis) {
            this.showError('No analysis data available for download');
            return;
        }
        
        // Check if docx library is loaded
        if (typeof docx === 'undefined') {
            this.showError('Word generation library not loaded. Please refresh the page and try again.');
            return;
        }
        
        try {
            // Show loading state
            this.downloadWord.textContent = '⏳ Generating Word...';
            this.downloadWord.disabled = true;
            
            const { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell } = docx;
            
            // Create document sections
            const children = [];
            
            // Header
            children.push(
                new Paragraph({
                    text: "CMML Market Scan - Triple Intelligence Report",
                    heading: HeadingLevel.TITLE,
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Company: ${this.currentAnalysis.company_name}`, bold: true }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Generated: ${new Date().toLocaleString()}` }),
                    ],
                }),
                new Paragraph({ text: "" }) // Space
            );
            
            // Add sections
            if (this.currentAnalysis.market_research) {
                children.push(...this.createWordSection('🔍 Market Research & Industry Analysis', this.currentAnalysis.market_research));
            }
            
            if (this.currentAnalysis.pdf_analysis) {
                children.push(...this.createWordSection('📊 Document Analysis (CMML Team)', this.currentAnalysis.pdf_analysis));
            }
            
            if (this.currentAnalysis.compliance_analysis) {
                children.push(...this.createWordSection('⚖️ Compliance & Due Diligence Analysis', this.currentAnalysis.compliance_analysis));
            }
            
            // Create document
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: children,
                }],
            });
            
            // Generate and download
            const blob = await Packer.toBlob(doc);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            const filename = `${this.currentAnalysis.company_name.replace(/[^a-z0-9]/gi, '_')}_triple_analysis_${new Date().toISOString().split('T')[0]}.docx`;
            
            a.href = url;
            a.download = filename;
            a.click();
            
            window.URL.revokeObjectURL(url);
            
            this.showDownloadSuccess('Word document downloaded successfully!');
            
        } catch (error) {
            console.error('Word generation error:', error);
            this.showError('Failed to generate Word document. Please try again.');
        } finally {
            // Reset button
            this.downloadWord.textContent = '📝 Download as Word';
            this.downloadWord.disabled = false;
        }
    }
    
    downloadAsText() {
        this.downloadOptions.classList.remove('show');
        
        if (!this.currentAnalysis) {
            this.showError('No analysis data available for download');
            return;
        }
        
        const content = [
            `CMML Market Scan - Triple Intelligence Report`,
            `Generated: ${new Date().toLocaleString()}`,
            `Company: ${this.currentAnalysis.company_name}`,
            ``,
            `${'='.repeat(70)}`,
            ``
        ];
        
        if (this.currentAnalysis.market_research) {
            content.push(`🔍 MARKET RESEARCH & INDUSTRY ANALYSIS`);
            content.push(`${'='.repeat(50)}`);
            content.push(``);
            content.push(this.currentAnalysis.market_research);
            content.push(``);
            content.push(``);
        }
        
        if (this.currentAnalysis.pdf_analysis) {
            content.push(`📊 DOCUMENT ANALYSIS (CMML TEAM)`);
            content.push(`${'='.repeat(50)}`);
            content.push(``);
            content.push(this.currentAnalysis.pdf_analysis);
            content.push(``);
            content.push(``);
        }
        
        if (this.currentAnalysis.compliance_analysis) {
            content.push(`⚖️ COMPLIANCE & DUE DILIGENCE ANALYSIS`);
            content.push(`${'='.repeat(50)}`);
            content.push(``);
            content.push(this.currentAnalysis.compliance_analysis);
        }
        
        const blob = new Blob([content.join('\n')], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const filename = `${this.currentAnalysis.company_name.replace(/[^a-z0-9]/gi, '_')}_triple_analysis_${new Date().toISOString().split('T')[0]}.txt`;
        
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        this.showDownloadSuccess('Text file downloaded successfully!');
    }
    
    addPdfSection(doc, title, content, yPosition) {
        // Check if we need a new page
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        // Section title
        doc.setFontSize(16);
        doc.setTextColor(102, 126, 234);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 20, yPosition);
        yPosition += 15;
        
        // Add section separator line
        doc.setDrawColor(102, 126, 234);
        doc.line(20, yPosition, 190, yPosition);
        yPosition += 10;
        
        // Convert markdown to clean text and format for PDF
        yPosition = this.addCleanContentToPdf(doc, content, yPosition);
        
        return yPosition + 15; // Extra spacing after section
    }
    
    addCleanContentToPdf(doc, content, yPosition) {
        if (!content) return yPosition;
        
        // Convert markdown to clean text
        let cleanText = this.markdownToCleanText(content);
        
        // Set font properties
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        // Split text into manageable chunks
        const lines = cleanText.split('\n').filter(line => line.trim());
        
        for (let line of lines) {
            // Check if we need a new page
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }
            
            // Handle different types of content
            if (line.startsWith('TABLE:')) {
                // Skip table markers - tables will be handled separately
                continue;
            } else if (line.match(/^[A-Z\s]+:$/)) {
                // Section headers
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(102, 126, 234);
                const wrappedLines = doc.splitTextToSize(line, 170);
                doc.text(wrappedLines, 20, yPosition);
                yPosition += (wrappedLines.length * 5) + 5;
                
                // Reset to normal
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);
            } else if (line.startsWith('•') || line.match(/^\d+\./)) {
                // List items
                const wrappedLines = doc.splitTextToSize(line, 165);
                doc.text(wrappedLines, 25, yPosition);
                yPosition += wrappedLines.length * 4;
            } else if (line.trim()) {
                // Regular paragraphs
                const wrappedLines = doc.splitTextToSize(line, 170);
                doc.text(wrappedLines, 20, yPosition);
                yPosition += (wrappedLines.length * 4) + 3;
            }
        }
        
        return yPosition;
    }
    
    markdownToCleanText(markdown) {
        if (!markdown) return '';
        
        let text = markdown;
        
        // Remove markdown syntax while preserving content
        text = text.replace(/^#{1,6}\s*/gm, ''); // Remove header markers
        text = text.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold markers
        text = text.replace(/\*(.*?)\*/g, '$1'); // Remove italic markers
        text = text.replace(/`(.*?)`/g, '$1'); // Remove inline code markers
        text = text.replace(/```[\s\S]*?```/g, '[Code Block]'); // Replace code blocks
        
        // Clean up tables - convert to simple format
        text = text.replace(/\|(.+)\|/g, (match, content) => {
            const cells = content.split('|').map(cell => cell.trim()).join(' | ');
            return cells;
        });
        
        // Remove table separator lines
        text = text.replace(/\|[\s\-\|]+\|/g, '');
        
        // Clean up list markers
        text = text.replace(/^[\*\-\+]\s+/gm, '• ');
        text = text.replace(/^\d+\.\s+/gm, (match, offset, string) => {
            const lineStart = string.lastIndexOf('\n', offset - 1) + 1;
            const lineNumber = string.substring(lineStart, offset).match(/^\d+/)?.[0] || '1';
            return `${lineNumber}. `;
        });
        
        // Clean up extra whitespace
        text = text.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
        text = text.replace(/[ \t]+/g, ' '); // Multiple spaces to single space
        text = text.trim();
        
        return text;
    }
    
    addFormattedMarkdownToPdf(doc, markdown, yPosition) {
        if (!markdown) return yPosition;
        
        // Split content into blocks
        const blocks = this.parseMarkdownBlocks(markdown);
        
        for (const block of blocks) {
            // Check if we need a new page
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }
            
            switch (block.type) {
                case 'header':
                    yPosition = this.addPdfHeader(doc, block, yPosition);
                    break;
                case 'table':
                    yPosition = this.addPdfTable(doc, block, yPosition);
                    break;
                case 'list':
                    yPosition = this.addPdfList(doc, block, yPosition);
                    break;
                case 'paragraph':
                    yPosition = this.addPdfParagraph(doc, block, yPosition);
                    break;
            }
            
            yPosition += 5; // Spacing between blocks
        }
        
        return yPosition;
    }
    
    parseMarkdownBlocks(markdown) {
        const blocks = [];
        const lines = markdown.split('\n');
        let currentBlock = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (!line) {
                if (currentBlock) {
                    blocks.push(currentBlock);
                    currentBlock = null;
                }
                continue;
            }
            
            // Check for headers
            if (line.match(/^#{1,3}\s/)) {
                if (currentBlock) blocks.push(currentBlock);
                const level = (line.match(/^#+/) || [''])[0].length;
                currentBlock = {
                    type: 'header',
                    level: level,
                    text: line.replace(/^#+\s*/, '')
                };
            }
            // Check for table rows
            else if (line.includes('|') && line.split('|').length > 2) {
                if (currentBlock && currentBlock.type !== 'table') {
                    blocks.push(currentBlock);
                    currentBlock = { type: 'table', rows: [] };
                }
                if (!currentBlock) currentBlock = { type: 'table', rows: [] };
                
                const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
                if (cells.length > 0 && !cells[0].match(/^-+$/)) { // Skip separator rows
                    currentBlock.rows.push(cells);
                }
            }
            // Check for list items
            else if (line.match(/^[\*\-\+]\s/) || line.match(/^\d+\.\s/)) {
                if (currentBlock && currentBlock.type !== 'list') {
                    blocks.push(currentBlock);
                    currentBlock = { type: 'list', items: [] };
                }
                if (!currentBlock) currentBlock = { type: 'list', items: [] };
                
                currentBlock.items.push(line.replace(/^[\*\-\+\d\.]\s*/, ''));
            }
            // Regular paragraph
            else {
                if (currentBlock && currentBlock.type !== 'paragraph') {
                    blocks.push(currentBlock);
                    currentBlock = { type: 'paragraph', text: '' };
                }
                if (!currentBlock) currentBlock = { type: 'paragraph', text: '' };
                
                currentBlock.text += (currentBlock.text ? ' ' : '') + line;
            }
        }
        
        if (currentBlock) blocks.push(currentBlock);
        return blocks;
    }
    
    addPdfHeader(doc, block, yPosition) {
        const fontSize = block.level === 1 ? 14 : (block.level === 2 ? 12 : 11);
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 65, 81);
        
        const lines = doc.splitTextToSize(block.text, 170);
        doc.text(lines, 20, yPosition);
        
        return yPosition + (lines.length * (fontSize * 0.4)) + 5;
    }
    
    addPdfTable(doc, block, yPosition) {
        if (block.rows.length === 0) return yPosition;
        
        // Use autoTable for professional table formatting
        const tableData = block.rows.slice(1); // Skip header row
        const headers = block.rows[0];
        
        doc.autoTable({
            startY: yPosition,
            head: [headers],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [102, 126, 234],
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 9,
                textColor: [55, 65, 81]
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251]
            },
            margin: { left: 20, right: 20 },
            columnStyles: {
                // Auto-adjust column widths
            }
        });
        
        return doc.lastAutoTable.finalY + 10;
    }
    
    addPdfList(doc, block, yPosition) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        for (const item of block.items) {
            const lines = doc.splitTextToSize(`• ${item}`, 165);
            doc.text(lines, 25, yPosition);
            yPosition += lines.length * 4;
        }
        
        return yPosition;
    }
    
    addPdfParagraph(doc, block, yPosition) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        // Process bold and italic formatting
        const formattedText = this.processPdfTextFormatting(doc, block.text, 20, yPosition, 170);
        
        return formattedText.finalY + 5;
    }
    
    processPdfTextFormatting(doc, text, x, y, maxWidth) {
        // Simple implementation - for full formatting, would need more complex parsing
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        
        return { finalY: y + (lines.length * 4) };
    }
    
    createWordSection(title, content) {
        const { Paragraph, HeadingLevel, TextRun } = docx;
        
        const sections = [
            new Paragraph({
                text: title,
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({ text: "" }) // Space
        ];
        
        // Convert markdown to clean text
        const cleanText = this.markdownToCleanText(content);
        
        // Split content into paragraphs
        const paragraphs = cleanText.split('\n\n').filter(para => para.trim());
        
        for (const para of paragraphs) {
            const lines = para.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                if (line.match(/^[A-Z\s]+:$/)) {
                    // Section headers
                    sections.push(new Paragraph({
                        children: [new TextRun({ text: line, bold: true, size: 24 })],
                        spacing: { before: 240, after: 120 }
                    }));
                } else if (line.startsWith('•') || line.match(/^\d+\./)) {
                    // List items
                    sections.push(new Paragraph({
                        children: [new TextRun(line)],
                        indent: { left: 720 }, // 0.5 inch indent
                        spacing: { after: 80 }
                    }));
                } else if (line.trim()) {
                    // Regular paragraphs
                    sections.push(new Paragraph({
                        children: [new TextRun(line)],
                        spacing: { after: 120 }
                    }));
                }
            }
        }
        
        sections.push(new Paragraph({ text: "" })); // Space after section
        
        return sections;
    }
    
    createWordHeader(block) {
        const { Paragraph, HeadingLevel, TextRun } = docx;
        
        let headingLevel;
        switch (block.level) {
            case 1:
                headingLevel = HeadingLevel.HEADING_2;
                break;
            case 2:
                headingLevel = HeadingLevel.HEADING_3;
                break;
            default:
                headingLevel = HeadingLevel.HEADING_4;
        }
        
        return new Paragraph({
            text: block.text,
            heading: headingLevel,
        });
    }
    
    createWordTable(block) {
        const { Table, TableRow, TableCell, WidthType, AlignmentType, Paragraph, TextRun } = docx;
        
        if (block.rows.length === 0) {
            return new Paragraph({ text: "" });
        }
        
        const tableRows = [];
        
        // Header row
        if (block.rows.length > 0) {
            const headerCells = block.rows[0].map(cellText => 
                new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({ text: cellText, bold: true })],
                        alignment: AlignmentType.CENTER,
                    })],
                    shading: {
                        fill: "667eea",
                    },
                })
            );
            tableRows.push(new TableRow({ children: headerCells }));
        }
        
        // Data rows
        for (let i = 1; i < block.rows.length; i++) {
            const dataCells = block.rows[i].map(cellText =>
                new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({ text: cellText })],
                    })],
                })
            );
            tableRows.push(new TableRow({ children: dataCells }));
        }
        
        return new Table({
            rows: tableRows,
            width: {
                size: 100,
                type: WidthType.PERCENTAGE,
            },
        });
    }
    
    createWordList(block) {
        const { Paragraph, TextRun } = docx;
        
        return block.items.map(item =>
            new Paragraph({
                children: [new TextRun(`• ${item}`)],
                indent: {
                    left: 720, // 0.5 inch indent
                },
            })
        );
    }
    
    createWordParagraph(block) {
        const { Paragraph, TextRun } = docx;
        
        // Parse bold and italic formatting
        const textRuns = this.parseWordTextFormatting(block.text);
        
        return new Paragraph({
            children: textRuns,
            spacing: {
                after: 120, // 6pt spacing after paragraph
            },
        });
    }
    
    parseWordTextFormatting(text) {
        const { TextRun } = docx;
        const runs = [];
        let currentPos = 0;
        
        // Simple regex to find bold text **text**
        const boldRegex = /\*\*(.*?)\*\*/g;
        let match;
        
        while ((match = boldRegex.exec(text)) !== null) {
            // Add text before bold
            if (match.index > currentPos) {
                const beforeText = text.substring(currentPos, match.index);
                if (beforeText) {
                    runs.push(new TextRun(beforeText));
                }
            }
            
            // Add bold text
            runs.push(new TextRun({ text: match[1], bold: true }));
            currentPos = match.index + match[0].length;
        }
        
        // Add remaining text
        if (currentPos < text.length) {
            const remainingText = text.substring(currentPos);
            if (remainingText) {
                runs.push(new TextRun(remainingText));
            }
        }
        
        // If no formatting found, return simple text run
        if (runs.length === 0) {
            runs.push(new TextRun(text));
        }
        
        return runs;
    }
    
    showDownloadSuccess(message) {
        // Create temporary success message
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            document.body.removeChild(successDiv);
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CMMLApp();
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});
