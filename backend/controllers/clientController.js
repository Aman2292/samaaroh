const clientService = require('../services/clientService');

/**
 * @route   POST /api/clients
 * @desc    Create a new client
 * @access  Private
 */
const createClient = async (req, res, next) => {
  try {
    const clientData = {
      ...req.body,
      organizationId: req.user.organizationId,
      createdBy: req.user._id
    };

    const client = await clientService.createClient(clientData);

    res.status(201).json({
      success: true,
      data: client
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/clients
 * @desc    Get all clients for the organization
 * @access  Private
 */
const getClients = async (req, res, next) => {
  try {
    const { page, limit, search, tags } = req.query;
    const organizationId = req.user.organizationId;

    const result = await clientService.getClients(organizationId, {
      page,
      limit,
      search,
      tags: tags ? tags.split(',') : []
    });

    res.json({
      success: true,
      data: result.docs,
      pagination: {
        total: result.totalDocs,
        page: result.page,
        pages: result.totalPages,
        limit: result.limit
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/clients/:id
 * @desc    Get a single client
 * @access  Private
 */
const getClient = async (req, res, next) => {
  try {
    const client = await clientService.getClientById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/clients/:id
 * @desc    Update a client
 * @access  Private
 */
const updateClient = async (req, res, next) => {
  try {
    const client = await clientService.updateClient(req.params.id, req.body);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/clients/:id
 * @desc    Soft delete a client
 * @access  Private
 */
const deleteClient = async (req, res, next) => {
  try {
    const client = await clientService.deleteClient(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient
};
