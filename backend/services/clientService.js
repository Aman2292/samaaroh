const Client = require('../models/Client');

/**
 * Create a new client
 */
const createClient = async (clientData) => {
  const client = await Client.create(clientData);
  return client;
};

/**
 * Get all clients for an organization with pagination and search
 */
const getClients = async (organizationId, { page = 1, limit = 10, search = '', tags = [] }) => {
  const query = { organizationId, isActive: true };

  // Search by name or phone
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by tags
  if (tags.length > 0) {
    query.tags = { $in: tags };
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: { path: 'createdBy', select: 'name email' }
  };

  const result = await Client.paginate(query, options);
  return result;
};

/**
 * Get a single client by ID
 */
const getClientById = async (clientId) => {
  const client = await Client.findById(clientId)
    .populate('createdBy', 'name email');
  return client;
};

/**
 * Update a client
 */
const updateClient = async (clientId, updateData) => {
  const client = await Client.findByIdAndUpdate(
    clientId,
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );
  return client;
};

/**
 * Soft delete a client (check for active events first)
 */
const deleteClient = async (clientId) => {
  const Event = require('../models/Event');
  
  // Check if client has active events
  const activeEvents = await Event.countDocuments({
    clientId,
    isActive: true,
    status: { $nin: ['completed', 'cancelled'] }
  });

  if (activeEvents > 0) {
    throw new Error('Cannot delete client with active events');
  }

  const client = await Client.findByIdAndUpdate(
    clientId,
    { isActive: false, updatedAt: Date.now() },
    { new: true }
  );

  return client;
};

module.exports = {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient
};
