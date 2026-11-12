"""
Enterprise PDF Document Generator — AuraPass™ Enterprise
Generates print-optimized, typography-standardized A4/Letter PDF reports
using ReportLab with two-pass NumberedCanvas pagination.
"""

import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas that accurately calculates and prints 'Page X of Y'
    along with a legal confidentiality footer on every page.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#6B7280"))
        page_w = self._pagesize[0]

        # Top subtle brand rule on later pages
        if self._pageNumber > 1:
            self.setStrokeColor(colors.HexColor("#E5E7EB"))
            self.setLineWidth(0.5)
            self.line(36, self._pagesize[1] - 30, page_w - 36, self._pagesize[1] - 30)
            self.drawString(36, self._pagesize[1] - 24, "AuraPass™ Enterprise Verification Audit")
            self.drawRightString(page_w - 36, self._pagesize[1] - 24, "Official Executive Record")

        # Bottom footer line
        self.setStrokeColor(colors.HexColor("#E5E7EB"))
        self.setLineWidth(0.5)
        self.line(36, 32, page_w - 36, 32)

        # Bottom metadata
        self.drawString(36, 20, "AuraPass™ Enterprise Platform — On-Premise Biometric Verification (Confidential)")
        self.drawRightString(page_w - 36, 20, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


def _get_document_styles():
    """Returns standardized enterprise corporate report typography styles."""
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'EnterpriseTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=3
    )

    subtitle_style = ParagraphStyle(
        'EnterpriseSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#475569'),
        spaceAfter=12
    )

    section_heading = ParagraphStyle(
        'EnterpriseSectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=14,
        spaceAfter=6
    )

    kpi_val_style = ParagraphStyle(
        'KPIValue',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#0F172A'),
        alignment=1  # Centered
    )

    kpi_lbl_style = ParagraphStyle(
        'KPILabel',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#64748B'),
        alignment=1  # Centered
    )

    th_style = ParagraphStyle(
        'TableHeaderCell',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#FFFFFF')
    )

    td_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#1E293B')
    )

    td_mono_style = ParagraphStyle(
        'TableCellMono',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#334155')
    )

    badge_confirmed = ParagraphStyle(
        'BadgeConfirmed',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9,
        textColor=colors.HexColor('#047857'),
        alignment=1
    )

    badge_unmatched = ParagraphStyle(
        'BadgeUnmatched',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9,
        textColor=colors.HexColor('#B91C1C'),
        alignment=1
    )

    legal_clause_title = ParagraphStyle(
        'LegalClauseTitle',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#111827'),
        spaceBefore=10,
        spaceAfter=4
    )

    legal_body = ParagraphStyle(
        'LegalBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#374151'),
        spaceAfter=6
    )

    return {
        'title': title_style,
        'subtitle': subtitle_style,
        'section_heading': section_heading,
        'kpi_val': kpi_val_style,
        'kpi_lbl': kpi_lbl_style,
        'th': th_style,
        'td': td_style,
        'td_mono': td_mono_style,
        'badge_confirmed': badge_confirmed,
        'badge_unmatched': badge_unmatched,
        'legal_title': legal_clause_title,
        'legal_body': legal_body,
    }


def _build_header_block(metadata, title_text, styles, width=523):
    """Constructs a clean, corporate header card with branding, org name, and document ID."""
    org_name = metadata.get('org_name') or 'AuraPass Enterprise'
    report_id = metadata.get('report_id') or 'AP-REP'
    gen_time = metadata.get('generated_at_human') or datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')
    period = metadata.get('period_label') or 'All-Time Historical'

    header_left = [
        Paragraph("AURAPASS™ ENTERPRISE", ParagraphStyle('Brand', fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#059669'))),
        Paragraph(title_text, styles['title']),
        Paragraph(f"Organization: <b>{org_name}</b> &bull; Reporting Period: <b>{period}</b>", styles['subtitle']),
    ]

    header_right = [
        Paragraph(f"<b>Document ID:</b> {report_id}", ParagraphStyle('Meta1', fontName='Courier-Bold', fontSize=8, leading=11, alignment=2, textColor=colors.HexColor('#0F172A'))),
        Paragraph(f"<b>Generated:</b> {gen_time}", ParagraphStyle('Meta2', fontName='Helvetica', fontSize=7.5, leading=10, alignment=2, textColor=colors.HexColor('#64748B'))),
        Paragraph("<b>Deployment:</b> Air-Gapped Local LAN", ParagraphStyle('Meta3', fontName='Helvetica', fontSize=7.5, leading=10, alignment=2, textColor=colors.HexColor('#64748B'))),
    ]

    header_table = Table(
        [[header_left, header_right]],
        colWidths=[width * 0.65, width * 0.35]
    )
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    return header_table


def _build_kpi_strip(kpi_items, styles, total_width=523):
    """Builds a cohesive row of KPI summary cards."""
    col_w = total_width / len(kpi_items)
    row_val = []
    row_lbl = []

    for item in kpi_items:
        row_val.append(Paragraph(item['value'], styles['kpi_val']))
        row_lbl.append(Paragraph(item['label'].upper(), styles['kpi_lbl']))

    kpi_table = Table([row_val, row_lbl], colWidths=[col_w] * len(kpi_items))
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 2),
        ('TOPPADDING', (0, 1), (-1, 1), 0),
        ('BOTTOMPADDING', (0, 1), (-1, 1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    return kpi_table


def _generate_analytics_pdf(report_data):
    """Generates the Executive Analytics PDF in A4 Portrait."""
    styles = _get_document_styles()
    metadata = report_data.get('metadata', {})
    overview = report_data.get('overview', {})
    dept_data = report_data.get('department_breakdown', {})
    late_data = report_data.get('late_arrival_analysis', {})

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=44
    )

    page_w = A4[0] - 72  # 523.27 pt printable width
    elements = []

    # 1. Header Block
    elements.append(_build_header_block(metadata, "Executive Analytics & Workforce Audit", styles, page_w))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#10B981'), spaceBefore=8, spaceAfter=12))

    # 2. Executive KPI Strip
    kpis = [
        {'value': str(overview.get('total_employees', 0)), 'label': 'Enrolled Personnel'},
        {'value': str(overview.get('total_attendance_logs', 0)), 'label': 'Recorded Events'},
        {'value': str(overview.get('confirmed_logs', 0)), 'label': 'Confirmed Matches'},
        {'value': f"{overview.get('recognition_rate', 0.0)}%", 'label': 'Verification Ratio'},
    ]
    elements.append(_build_kpi_strip(kpis, styles, page_w))
    elements.append(Spacer(1, 14))

    # 3. Department Breakdown Section
    elements.append(Paragraph("1. Department Attendance & Verification Breakdown", styles['section_heading']))

    dept_rows = [
        [
            Paragraph("Department", styles['th']),
            Paragraph("Active Staff", styles['th']),
            Paragraph("Check-Ins", styles['th']),
            Paragraph("Unique Present", styles['th']),
            Paragraph("Attendance Rate", styles['th']),
            Paragraph("Avg Confidence", styles['th']),
        ]
    ]

    departments_list = dept_data.get('departments', [])
    if dept_data.get('unassigned'):
        departments_list = list(departments_list) + [dept_data['unassigned']]

    if departments_list:
        for d in departments_list:
            conf_str = f"{d.get('avg_confidence', 0.0)}%" if d.get('avg_confidence') else "N/A"
            dept_rows.append([
                Paragraph(str(d.get('name', 'General')), styles['td']),
                Paragraph(str(d.get('total_employees', 0)), styles['td_mono']),
                Paragraph(str(d.get('total_checkins', 0)), styles['td_mono']),
                Paragraph(str(d.get('unique_present', 0)), styles['td_mono']),
                Paragraph(f"{d.get('avg_attendance_rate', 0.0)}%", styles['td_mono']),
                Paragraph(conf_str, styles['td_mono']),
            ])
    else:
        dept_rows.append([Paragraph("No department attendance recorded in selected period.", styles['td'])] + [Paragraph("-", styles['td_mono'])] * 5)

    t_dept = Table(dept_rows, colWidths=[page_w * 0.28, page_w * 0.14, page_w * 0.14, page_w * 0.15, page_w * 0.15, page_w * 0.14])
    t_dept.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')])
    ]))
    elements.append(t_dept)
    elements.append(Spacer(1, 14))

    # 4. Late Arrival & Shift Compliance Analysis
    elements.append(Paragraph("2. Shift Compliance & Late Arrival Analysis", styles['section_heading']))

    tot_analyzed = late_data.get('total_checkins_analyzed', 0)
    late_cnt = late_data.get('late_count', 0)
    late_pct = late_data.get('late_percentage', 0.0)
    avg_del = late_data.get('avg_delay_minutes', 0.0)
    shift_start = late_data.get('work_start', '09:00')

    late_rows = [
        [Paragraph("Shift Metric", styles['th']), Paragraph("Measurement / Reconciled Value", styles['th'])],
        [Paragraph("Authorized Shift Window Start", styles['td']), Paragraph(f"{shift_start} (Configured Base)", styles['td_mono'])],
        [Paragraph("First Check-Ins Analyzed (Unique Staff-Days)", styles['td']), Paragraph(str(tot_analyzed), styles['td_mono'])],
        [Paragraph("Late Arrivals Count", styles['td']), Paragraph(str(late_cnt), styles['td_mono'])],
        [Paragraph("Late Arrival Percentage", styles['td']), Paragraph(f"{late_pct}% (of analyzed first check-ins)", styles['td_mono'])],
        [Paragraph("Average Lateness Delay", styles['td']), Paragraph(f"{avg_del} minutes" if late_cnt > 0 else "0.0 minutes (Full Shift Compliance)", styles['td_mono'])],
    ]

    t_late = Table(late_rows, colWidths=[page_w * 0.55, page_w * 0.45])
    t_late.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')])
    ]))
    elements.append(t_late)
    elements.append(Spacer(1, 18))

    # 5. Technical Standard & Sign-off Block
    sig_content = [
        [
            Paragraph("<b>Biometric Pipeline Standard:</b> On-Premise 512-D Cosine Metric Alignment<br/>"
                      "<b>Data Custody:</b> Sovereign Air-Gapped Local LAN Execution (Zero Cloud Egress)<br/>"
                      "<b>Data Privacy Compliance:</b> Digital Personal Data Protection (DPDP) Act 2023 Principles", styles['td']),
            Paragraph("<b>Authorized Executive / HR Signatory:</b><br/><br/>"
                      "___________________________________________<br/>"
                      "Authorized Signature & Official Date Stamp", styles['td'])
        ]
    ]
    t_sig = Table(sig_content, colWidths=[page_w * 0.58, page_w * 0.42])
    t_sig.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
    ]))
    elements.append(KeepTogether(t_sig))

    doc.build(elements, canvasmaker=NumberedCanvas)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def _generate_attendance_pdf(report_data):
    """
    Generates the Detailed Attendance Register PDF in A4 Landscape.
    Includes tabular records with pagination and repeated table headers.
    """
    styles = _get_document_styles()
    metadata = report_data.get('metadata', {})
    summary = report_data.get('summary', {})
    records = report_data.get('records', [])

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=44
    )

    page_w = landscape(A4)[0] - 72  # 769.89 pt printable width
    elements = []

    # 1. Header Block
    elements.append(_build_header_block(metadata, "Verified Attendance & Biometric Access Register", styles, page_w))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#10B981'), spaceBefore=8, spaceAfter=12))

    # 2. Summary KPI Strip
    kpis = [
        {'value': str(summary.get('total_events', 0)), 'label': 'Total Recorded Events'},
        {'value': str(summary.get('confirmed_matches', 0)), 'label': 'Confirmed Matches'},
        {'value': str(summary.get('unmatched_events', 0)), 'label': 'Unmatched / Flagged'},
        {'value': f"{summary.get('match_ratio_pct', 0.0)}%", 'label': 'Confirmation Ratio'},
        {'value': str(summary.get('unique_persons_verified', 0)), 'label': 'Unique Personnel'},
    ]
    elements.append(_build_kpi_strip(kpis, styles, page_w))
    elements.append(Spacer(1, 14))

    # 3. Tabular Attendance Log Records (repeated table headers on all pages)
    elements.append(Paragraph("Chronological Attendance Register", styles['section_heading']))

    table_rows = [
        [
            Paragraph("#", styles['th']),
            Paragraph("Timestamp (Local)", styles['th']),
            Paragraph("Employee Code", styles['th']),
            Paragraph("Personnel Name", styles['th']),
            Paragraph("Department", styles['th']),
            Paragraph("Access Lane / Camera", styles['th']),
            Paragraph("Confidence", styles['th']),
            Paragraph("Audit Status", styles['th']),
        ]
    ]

    if records:
        for r in records[:500]:  # Cap at 500 for single document stability
            status_p = Paragraph("CONFIRMED", styles['badge_confirmed']) if r.get('is_confirmed') else Paragraph("NOT MATCHED", styles['badge_unmatched'])
            conf_str = f"{r.get('confidence_pct', 0.0)}%" if r.get('confidence_pct') else "N/A"
            table_rows.append([
                Paragraph(str(r.get('index', 1)), styles['td_mono']),
                Paragraph(r.get('timestamp_human', 'N/A'), styles['td_mono']),
                Paragraph(r.get('employee_code', 'N/A'), styles['td_mono']),
                Paragraph(r.get('person_name', 'Unknown'), styles['td']),
                Paragraph(r.get('department', 'General'), styles['td']),
                Paragraph(r.get('camera_name', 'Lane 01'), styles['td']),
                Paragraph(conf_str, styles['td_mono']),
                status_p,
            ])
    else:
        table_rows.append([Paragraph("No attendance records match the selected date or department filters.", styles['td'])] + [Paragraph("-", styles['td_mono'])] * 7)

    col_widths = [
        page_w * 0.04,  # #
        page_w * 0.18,  # Timestamp
        page_w * 0.13,  # Code
        page_w * 0.18,  # Name
        page_w * 0.14,  # Department
        page_w * 0.15,  # Camera
        page_w * 0.08,  # Conf
        page_w * 0.10,  # Status
    ]

    t_register = Table(table_rows, colWidths=col_widths, repeatRows=1)
    t_register.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')])
    ]))
    elements.append(t_register)

    doc.build(elements, canvasmaker=NumberedCanvas)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def _generate_audit_pdf(report_data):
    """Generates the Security & Audit Trail Register PDF in A4 Portrait."""
    styles = _get_document_styles()
    metadata = report_data.get('metadata', {})
    summary = report_data.get('summary', {})
    records = report_data.get('records', [])

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=44
    )

    page_w = A4[0] - 72
    elements = []

    elements.append(_build_header_block(metadata, "Security Audit Trail & Governance Log", styles, page_w))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#10B981'), spaceBefore=8, spaceAfter=12))

    kpis = [
        {'value': str(summary.get('total_audit_events', 0)), 'label': 'Total Events'},
        {'value': str(summary.get('access_events', 0)), 'label': 'Access Verifications'},
        {'value': str(summary.get('feedback_events', 0)), 'label': 'Operator Feedback'},
        {'value': str(summary.get('consent_events', 0)), 'label': 'Biometric Consents'},
    ]
    elements.append(_build_kpi_strip(kpis, styles, page_w))
    elements.append(Spacer(1, 14))

    table_rows = [
        [
            Paragraph("#", styles['th']),
            Paragraph("Event Type", styles['th']),
            Paragraph("Timestamp (Local)", styles['th']),
            Paragraph("Details & Subject", styles['th']),
            Paragraph("Status", styles['th']),
        ]
    ]

    if records:
        for r in records[:300]:
            table_rows.append([
                Paragraph(str(r.get('index', 1)), styles['td_mono']),
                Paragraph(r.get('type', 'General'), styles['td']),
                Paragraph(r.get('timestamp_human', 'N/A'), styles['td_mono']),
                Paragraph(r.get('details', '-'), styles['td']),
                Paragraph(r.get('status', 'OK'), styles['td_mono']),
            ])
    else:
        table_rows.append([Paragraph("No security audit events recorded.", styles['td'])] + [Paragraph("-", styles['td_mono'])] * 4)

    t_audit = Table(table_rows, colWidths=[page_w * 0.05, page_w * 0.22, page_w * 0.23, page_w * 0.38, page_w * 0.12], repeatRows=1)
    t_audit.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')])
    ]))
    elements.append(t_audit)

    doc.build(elements, canvasmaker=NumberedCanvas)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def generate_legal_pdf(doc_type="terms", org_name="AuraPass Deploying Organization"):
    """
    Generates official downloadable PDF copies of Terms of Service or Privacy Policy
    without any browser Ctrl+P artifacts, URLs, or headers.
    """
    styles = _get_document_styles()
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=44,
        rightMargin=44,
        topMargin=40,
        bottomMargin=44
    )

    page_w = A4[0] - 88
    elements = []

    is_terms = (doc_type == 'terms')
    title = "Commercial Software License Agreement" if is_terms else "Biometric Data Sovereignty & Privacy Policy"
    doc_id = "AP-LIC-2026.2" if is_terms else "AP-PRIV-2026.2"

    metadata = {
        'org_name': org_name,
        'report_id': doc_id,
        'generated_at_human': datetime.now().strftime('%Y-%m-%d'),
        'period_label': 'Version 2026.2 LTS',
    }

    elements.append(_build_header_block(metadata, title, styles, page_w))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#10B981'), spaceBefore=8, spaceAfter=14))

    if is_terms:
        clauses = [
            ("1. License Grant & Deployment Scope",
             "Subject to the terms of this Agreement, AuraPass grants the Deploying Organization a non-exclusive, non-transferable, revocable license to deploy, execute, and operate the AuraPass Enterprise software solely within the organization's designated on-premise facilities and private cloud instances. Deployment is authorized for the number of enrolled employees and active RTSP camera feeds defined within the organization's active tier."),
            ("2. Data Custody & Zero Cloud Egress",
             "The Deploying Organization retains 100% exclusive legal title, ownership, and custody over all databases, biometric vector embeddings, employee names, timestamps, and camera streams processed by the software. AuraPass affirms that the software does not transmit, replicate, or synchronize any customer biometric data to external third parties or public cloud storage."),
            ("3. Workplace Consent & Labor Compliance",
             "The Deploying Organization is solely responsible for procuring all legally required employee and contractor consents prior to biometric enrollment and complying with applicable workplace monitoring and biometric privacy laws (e.g. DPDP Act 2023, GDPR Art 9). The organization must provide accessible alternative check-in mechanisms for staff who decline biometric presence verification."),
            ("4. Physical Hardware Boundary & Turnstile Safety",
             "AuraPass interfaces with physical access barriers via standard dry-contact relay signals. Life Safety Requirement: The Deploying Organization must ensure that all physical turnstiles and gates include a fail-open emergency hardware interlock connected to the central fire alarm system, independent of software operation."),
            ("5. Intellectual Property & Model Weights",
             "AuraPass and its licensors retain all intellectual property rights in the software architecture, deep neural network inference pipelines, compiled binaries, and user interfaces. The Deploying Organization shall not reverse engineer, decompile, extract neural weights, or redistribute the software engine to unauthorized third parties."),
            ("6. Service Level Agreements & Warranties",
             "AuraPass warrants that the software will perform substantially in accordance with documented technical specifications. Production recognition accuracy depends upon adhering to documented illumination (300 to 700 Lux), camera angles (within 15° yaw), and network bandwidth requirements."),
            ("7. Termination & Zero-Trace Data Wipe",
             "Upon termination of the license agreement, the Deploying Organization retains its raw attendance records and payroll logs. The Deploying Organization agrees to discontinue use of the software engine and may execute a full zero-trace disk wipe of vector embeddings at their discretion.")
        ]
    else:
        clauses = [
            ("1. Privacy-by-Design Architecture",
             "AuraPass is built from the ground up on strict privacy-by-design principles. All facial detection, embedding extraction, and attendance logging occur 100% on-premise on your local hardware or private network. No facial images or biometric embeddings are ever transmitted to AuraPass, external third parties, or cloud servers."),
            ("2. Data We Process",
             "The on-premise software processes: Employee names and organization IDs; Facial vector embeddings (512-dimensional mathematical float representations, not raw photos); Check-in timestamps and access lane IDs; Optional operator verification logs."),
            ("3. Non-Invertible Cryptographic Embeddings",
             "Face recognition is conducted using non-invertible 512-D neural vector embeddings. It is computationally irreversible to reconstruct a human face from these stored vectors. Stored vector templates are protected by database encryption and tenant-level cryptographic boundaries."),
            ("4. Employee Rights & Revocation",
             "Employees retain the right to request deletion of their biometric vector gallery, view their access logs, and withdraw consent. When an employee profile is deleted, their facial vectors are purged from active memory and database tables immediately."),
            ("5. Data Retention & Automatic Purge",
             "The Deploying Organization configures automated log retention periods (30, 90, 180, or 365 days). Once the retention threshold is reached, expired check-in records are automatically purged from the local database."),
            ("6. Regulatory Compliance Standards",
             "This architecture adheres to the principles of the Indian Digital Personal Data Protection (DPDP) Act 2023, European Union GDPR (Special Category Data under Article 9), and biometric privacy regulations by enforcing purposeful data collection, storage minimization, and absolute local data sovereignty.")
        ]

    for clause_title, clause_text in clauses:
        elements.append(Paragraph(clause_title, styles['legal_title']))
        elements.append(Paragraph(clause_text, styles['legal_body']))
        elements.append(Spacer(1, 4))

    elements.append(Spacer(1, 14))

    # Sign-off block
    sig_content = [
        [
            Paragraph("<b>Legal Inquiries:</b> legal@aurapass.in &bull; compliance@aurapass.in<br/>"
                      "<b>Software Release:</b> AuraPass™ Enterprise v2.0-LTS", styles['td']),
            Paragraph("<b>Authorized Representative:</b><br/><br/>"
                      "___________________________________________<br/>"
                      "Authorized Corporate Signature & Seal", styles['td'])
        ]
    ]
    t_sig = Table(sig_content, colWidths=[page_w * 0.6, page_w * 0.4])
    t_sig.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
    ]))
    elements.append(KeepTogether(t_sig))

    doc.build(elements, canvasmaker=NumberedCanvas)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def generate_pdf_report(report_data):
    """Master dispatcher that produces verified PDFs based on report_type."""
    report_type = report_data.get('metadata', {}).get('report_type', 'executive_analytics')

    if report_type == 'attendance_register':
        return _generate_attendance_pdf(report_data)
    elif report_type == 'audit_trail':
        return _generate_audit_pdf(report_data)
    else:
        return _generate_analytics_pdf(report_data)

