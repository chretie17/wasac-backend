const { sequelize } = require('../models');
const ejs = require('ejs');
const path = require('path');
const puppeteer = require('puppeteer');

exports.getReportData = async (req, res) => {
  try {
    const { date } = req.query;
    let dateCondition = '';
    
    // Ensure the date is properly formatted as YYYY-MM-DD
    if (date) {
      dateCondition = `WHERE DATE(createdAt) = '${date}'`;
    }

    const applicationStatus = await sequelize.query(
      `SELECT status, COUNT(*) AS count FROM MutationApplications ${dateCondition} GROUP BY status`,
      { type: sequelize.QueryTypes.SELECT }
    );

    const claimStatus = await sequelize.query(
      `SELECT status, COUNT(*) AS count FROM Claims ${dateCondition} GROUP BY status`,
      { type: sequelize.QueryTypes.SELECT }
    );

    // For applicationsByMonth, consider the date filter to limit results by the given date
    const applicationsByMonth = await sequelize.query(
      `SELECT 
        MONTHNAME(createdAt) as month, 
        COUNT(*) as count 
      FROM MutationApplications 
      ${dateCondition}
      GROUP BY month 
      ORDER BY FIELD(month, 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December')`,
      { type: sequelize.QueryTypes.SELECT }
    );

    res.json({
      applicationStatus,
      claimStatus,
      applicationsByMonth,
    });
  } catch (error) {
    console.error('Error fetching report data:', error);
    res.status(500).json({ error: 'Error fetching report data' });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const imagePath = path.join(__dirname, 'WasacGroupLogo1.png'); // Same folder as the controller
    const { date } = req.query;
    let dateCondition = '';
    
    if (date) {
      dateCondition = `WHERE DATE(createdAt) = '${date}'`;
    }

    const applicationStatus = await sequelize.query(
      `SELECT status, COUNT(*) AS count FROM MutationApplications ${dateCondition} GROUP BY status`,
      { type: sequelize.QueryTypes.SELECT }
    );

    const claimStatus = await sequelize.query(
      `SELECT status, COUNT(*) AS count FROM Claims ${dateCondition} GROUP BY status`,
      { type: sequelize.QueryTypes.SELECT }
    );

    const applicationsByMonth = await sequelize.query(
      `SELECT 
        MONTHNAME(createdAt) as month, 
        COUNT(*) as count 
      FROM MutationApplications 
      ${dateCondition}
      GROUP BY month 
      ORDER BY FIELD(month, 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December')`,
      { type: sequelize.QueryTypes.SELECT }
    );

    const data = {
      applicationStatus,
      claimStatus,
      applicationsByMonth,
      imagePath,
    };

    const templatePath = path.join(__dirname, '../views/reportTemplate.ejs');
    const html = await ejs.renderFile(templatePath, data);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    const pdf = await page.pdf({ format: 'A4' });

    await browser.close();

    res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Error generating report' });
  }
};
// controllers/reportController.js
exports.generateReportByDate = async (req, res) => {
  try {
    console.log('Received request to generate report by date');
    const { date } = req.query;
    if (!date) {
      console.log('Date parameter is missing');
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    // Ensure the date is correctly formatted and only includes the date part
    const dateCondition = `DATE(createdAt) = '${date}'`;
    console.log('Date condition:', dateCondition);

    const applicationStatus = await sequelize.query(
      `SELECT status, COUNT(*) AS count FROM MutationApplications WHERE ${dateCondition} GROUP BY status`,
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('Fetched application status:', applicationStatus);

    const claimStatus = await sequelize.query(
      `SELECT status, COUNT(*) AS count FROM Claims WHERE ${dateCondition} GROUP BY status`,
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('Fetched claim status:', claimStatus);

    const data = { applicationStatus, claimStatus };
    console.log('Data to be rendered:', data);

    const templatePath = path.join(__dirname, '../views/reportTemplate.ejs');
    console.log('Template path:', templatePath);
    
    const html = await ejs.renderFile(templatePath, data);
    console.log('Generated HTML:', html.substring(0, 100)); // Log only the beginning of HTML for brevity

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    const pdf = await page.pdf({ format: 'A4' });
    console.log('PDF generated successfully');

    await browser.close();

    res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
    console.log('PDF sent successfully');
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Error generating report' });
  }
};

exports.getReportsByDate = async (req, res) => {
  try {
    console.log('Received request to fetch reports by date');
    const { date } = req.query;
    if (!date) {
      console.log('Date parameter is missing');
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    // Ensure the date is correctly formatted and only includes the date part
    const dateCondition = `DATE(createdAt) = '${date}'`;
    console.log('Date condition:', dateCondition);

    const applicationStatus = await sequelize.query(
      `SELECT status, COUNT(*) AS count FROM MutationApplications WHERE ${dateCondition} GROUP BY status`,
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('Fetched application status:', applicationStatus);

    const claimStatus = await sequelize.query(
      `SELECT status, COUNT(*) AS count FROM Claims WHERE ${dateCondition} GROUP BY status`,
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('Fetched claim status:', claimStatus);

    res.json({
      applicationStatus,
      claimStatus,
    });
    console.log('Response sent with data');
  } catch (error) {
    console.error('Error fetching report data:', error);
    res.status(500).json({ error: 'Error fetching report data' });
  }
};
