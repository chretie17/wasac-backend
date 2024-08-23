const { Meter } = require('../models');

exports.addMeter = async (req, res) => {
  const { meterNumber, ownerName, latitude, longitude, nationalId } = req.body; // Include nationalId in the request body

  try {
    const newMeter = await Meter.create({
      meterNumber,
      ownerName,
      latitude,
      longitude,
      nationalId, // Use the nationalId provided in the request body
    });
    res.status(201).json(newMeter);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getUserMeters = async (req, res) => {
  try {
    const meters = await Meter.findAll({
      where: { nationalId: req.user.nationalId } // Filter meters by the user's nationalId
    });
    res.json(meters);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


exports.updateMeter = async (req, res) => {
  const { id } = req.params;
  const { meterNumber, ownerName, latitude, longitude, nationalId } = req.body;

  try {
    // Find the meter by id and ensure it belongs to the current user's nationalId
    const meter = await Meter.findOne({
      where: { id, nationalId: req.user.nationalId }
    });

    if (!meter) {
      return res.status(404).json({ error: 'Meter not found' });
    }

    // Update the meter's details, including the nationalId if provided
    meter.meterNumber = meterNumber || meter.meterNumber;
    meter.ownerName = ownerName || meter.ownerName;
    meter.latitude = latitude || meter.latitude;
    meter.longitude = longitude || meter.longitude;
    meter.nationalId = nationalId || meter.nationalId;  // Update nationalId if provided

    // Save the updated meter
    await meter.save();

    // Respond with the updated meter data
    res.json(meter);
  } catch (error) {
    // Handle any errors that occur during the update process
    res.status(400).json({ error: error.message });
  }
};


exports.deleteMeter = async (req, res) => {
  const { id } = req.params;

  try {
    const meter = await Meter.findOne({
      where: { id, nationalId: req.user.nationalId } // Ensure the meter belongs to the user
    });
    if (!meter) return res.status(404).json({ error: 'Meter not found' });

    await meter.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


exports.getAllMeters = async (req, res) => {
  try {
    const meters = await Meter.findAll();
    res.json(meters);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
