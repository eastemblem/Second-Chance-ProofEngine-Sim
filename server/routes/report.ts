import { Router } from "express";
import { reportService } from "../services/report-service";

const router = Router();

// Generate HTML report for a venture
router.post("/generate/:ventureId", async (req, res) => {
  try {
    const { ventureId } = req.params;
    const { sessionId } = req.body;
    
    console.log(`Generating HTML report for venture: ${ventureId}`);
    
    const { html, fileName } = await reportService.generateHtmlReport(ventureId, sessionId);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(html);
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ 
      error: "Failed to generate report",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Generate and upload report to data room
router.post("/generate-and-upload/:ventureId", async (req, res) => {
  try {
    const { ventureId } = req.params;
    const { sessionId } = req.body;
    
    console.log(`Generating and uploading HTML report for venture: ${ventureId}`);
    
    const { html, fileName } = await reportService.generateHtmlReport(ventureId, sessionId);
    const uploadResult = await reportService.saveAndUploadReport(html, fileName, sessionId);
    
    if (uploadResult.error) {
      return res.status(500).json({ error: uploadResult.error });
    }
    
    res.json({
      success: true,
      fileName,
      fileUrl: uploadResult.fileUrl,
      message: "Report generated and uploaded to data room successfully"
    });
  } catch (error) {
    console.error("Error generating and uploading report:", error);
    res.status(500).json({ 
      error: "Failed to generate and upload report",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Generate report from session data (for demo/incomplete onboarding)
router.post("/generate-session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log(`Generating HTML report from session: ${sessionId}`);
    
    const { html, fileName } = await reportService.generateHtmlReport(undefined, sessionId);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(html);
  } catch (error) {
    console.error("Error generating session report:", error);
    res.status(500).json({ 
      error: "Failed to generate session report",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Generate and upload session report
router.post("/generate-and-upload-session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log(`Generating and uploading HTML report from session: ${sessionId}`);
    
    const { html, fileName } = await reportService.generateHtmlReport(undefined, sessionId);
    const uploadResult = await reportService.saveAndUploadReport(html, fileName, sessionId);
    
    if (uploadResult.error) {
      return res.status(500).json({ error: uploadResult.error });
    }
    
    res.json({
      success: true,
      fileName,
      fileUrl: uploadResult.fileUrl,
      message: "Session report generated and uploaded to data room successfully"
    });
  } catch (error) {
    console.error("Error generating and uploading session report:", error);
    res.status(500).json({ 
      error: "Failed to generate and upload session report",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export { router as reportRoutes };