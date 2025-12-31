const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import models directly
const Invoice = require('../models/Invoice');
const Document = require('../models/Document');

/**
 * Migrate existing invoices to document management system
 * Creates Document entries for all invoices with PDFs
 */
const migrateInvoicesToDocuments = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI missing in .env file");
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB\n");
    
    console.log('═'.repeat(60));
    console.log('INVOICE TO DOCUMENT MIGRATION');
    console.log('═'.repeat(60));
    console.log('');
    
    // Find all invoices with PDF URLs
    const invoices = await Invoice.find({ 
      pdfUrl: { $exists: true, $ne: null }
    }).populate('clientId createdBy organizationId');
    
    console.log(`Found ${invoices.length} invoices with PDFs\n`);
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const invoice of invoices) {
      try {
        // Check if document already exists
        const existingDoc = await Document.findOne({ invoiceId: invoice._id });
        
        if (existingDoc) {
          console.log(`⏭️  Skipped: Invoice ${invoice.invoiceNumber} - document already exists`);
          skipped++;
          continue;
        }
        
        // Get file size if PDF exists
        let fileSize = null;
        if (invoice.pdfUrl) {
          const filePath = path.join(__dirname, '..', 'public', invoice.pdfUrl);
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            fileSize = stats.size;
          }
        }
        
        // Create document
        const document = await Document.create({
          organizationId: invoice.organizationId,
          entityType: 'invoice',
          entityId: invoice.clientId,
          invoiceId: invoice._id,
          
          name: `Invoice ${invoice.invoiceNumber}`,
          originalFileName: `invoice_${invoice.invoiceNumber}.pdf`,
          fileUrl: invoice.pdfUrl,
          fileSize,
          mimeType: 'application/pdf',
          
          category: 'invoice',
          subcategory: 'client_invoice',
          tags: ['invoice', invoice.status],
          
          invoiceMetadata: {
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: invoice.invoiceDate,
            dueDate: invoice.dueDate,
            amount: invoice.total,
            status: invoice.status,
            paidAmount: invoice.paidAmount,
            balanceAmount: invoice.balanceAmount
          },
          
          uploadedBy: invoice.createdBy,
          uploadedAt: invoice.createdAt,
          visibility: 'client'
        });
        
        // Update invoice with documentId
        invoice.documentId = document._id;
        await invoice.save();
        
        console.log(`✓ Migrated: Invoice ${invoice.invoiceNumber} → Document ${document._id}`);
        migrated++;
        
      } catch (error) {
        console.error(`✗ Error migrating invoice ${invoice.invoiceNumber}:`, error.message);
        errors++;
      }
    }
    
    console.log('');
    console.log('═'.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Total invoices found:  ${invoices.length}`);
    console.log(`✓ Successfully migrated: ${migrated}`);
    console.log(`⏭️  Skipped (already migrated): ${skipped}`);
    console.log(`✗ Errors: ${errors}`);
    console.log('═'.repeat(60));
    console.log('');
    
    if (errors === 0) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('⚠️  Migration completed with some errors');
    }
    
  } catch (error) {
    console.error("✗ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n✓ Disconnected from MongoDB");
    process.exit(0);
  }
};

migrateInvoicesToDocuments();
