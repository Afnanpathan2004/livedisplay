const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const { logger } = require('./logger');
const { auditLog } = require('./audit');

/**
 * Production-ready email service
 * Handles templated emails, queuing, and delivery tracking
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = new Map();
    this.emailQueue = [];
    this.isProcessing = false;
    this.retryAttempts = 3;
    this.retryDelay = 5000; // 5 seconds
    
    this.config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5
    };

    this.defaultFrom = {
      name: process.env.SMTP_FROM_NAME || 'LiveDisplay System',
      address: process.env.SMTP_FROM_EMAIL || 'noreply@livedisplay.com'
    };

    this.initializeTransporter();
    this.loadEmailTemplates();
    this.startQueueProcessor();
  }

  /**
   * Initialize email transporter
   */
  async initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransporter(this.config);
      
      // Verify connection
      await this.transporter.verify();
      
      logger.info('Email service initialized successfully', {
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure
      });
      
    } catch (error) {
      logger.error('Failed to initialize email service', {
        error: error.message,
        config: {
          host: this.config.host,
          port: this.config.port,
          user: this.config.auth.user
        }
      });
      
      // Don't throw - allow app to start without email
      this.transporter = null;
    }
  }

  /**
   * Load email templates
   */
  async loadEmailTemplates() {
    const templateDir = process.env.EMAIL_TEMPLATE_DIR || path.join(__dirname, '..', 'templates', 'email');
    
    try {
      const templateFiles = await fs.readdir(templateDir);
      
      for (const file of templateFiles) {
        if (path.extname(file) === '.hbs' || path.extname(file) === '.handlebars') {
          const templateName = path.basename(file, path.extname(file));
          const templatePath = path.join(templateDir, file);
          const templateContent = await fs.readFile(templatePath, 'utf8');
          
          this.templates.set(templateName, handlebars.compile(templateContent));
          
          logger.debug('Email template loaded', { templateName });
        }
      }
      
      logger.info('Email templates loaded', { 
        count: this.templates.size,
        templates: Array.from(this.templates.keys())
      });
      
    } catch (error) {
      logger.warn('Failed to load email templates', {
        templateDir,
        error: error.message
      });
    }
  }

  /**
   * Send email (adds to queue)
   */
  async sendEmail(options) {
    const emailJob = {
      id: require('crypto').randomUUID(),
      ...options,
      createdAt: new Date(),
      attempts: 0,
      status: 'queued'
    };

    this.emailQueue.push(emailJob);
    
    logger.debug('Email added to queue', {
      emailId: emailJob.id,
      to: emailJob.to,
      subject: emailJob.subject,
      template: emailJob.template
    });

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }

    return emailJob.id;
  }

  /**
   * Send templated email
   */
  async sendTemplatedEmail(templateName, to, data = {}, options = {}) {
    if (!this.templates.has(templateName)) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const template = this.templates.get(templateName);
    const html = template({
      ...data,
      companyName: process.env.COMPANY_NAME || 'LiveDisplay',
      companyLogo: process.env.COMPANY_LOGO_URL || '',
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      currentYear: new Date().getFullYear()
    });

    return this.sendEmail({
      to,
      subject: options.subject || data.subject || 'Notification',
      html,
      template: templateName,
      data,
      ...options
    });
  }

  /**
   * Process email queue
   */
  async processQueue() {
    if (this.isProcessing || this.emailQueue.length === 0 || !this.transporter) {
      return;
    }

    this.isProcessing = true;

    while (this.emailQueue.length > 0) {
      const emailJob = this.emailQueue.shift();
      
      try {
        await this.deliverEmail(emailJob);
        
      } catch (error) {
        emailJob.attempts++;
        emailJob.lastError = error.message;
        emailJob.status = 'failed';

        if (emailJob.attempts < this.retryAttempts) {
          // Re-queue for retry
          emailJob.status = 'retry';
          setTimeout(() => {
            this.emailQueue.push(emailJob);
          }, this.retryDelay * emailJob.attempts);
          
          logger.warn('Email delivery failed, will retry', {
            emailId: emailJob.id,
            attempt: emailJob.attempts,
            error: error.message
          });
        } else {
          logger.error('Email delivery failed permanently', {
            emailId: emailJob.id,
            attempts: emailJob.attempts,
            error: error.message,
            to: emailJob.to,
            subject: emailJob.subject
          });
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Deliver individual email
   */
  async deliverEmail(emailJob) {
    const mailOptions = {
      from: emailJob.from || this.defaultFrom,
      to: emailJob.to,
      cc: emailJob.cc,
      bcc: emailJob.bcc,
      subject: emailJob.subject,
      text: emailJob.text,
      html: emailJob.html,
      attachments: emailJob.attachments,
      headers: {
        'X-Email-ID': emailJob.id,
        'X-Template': emailJob.template || 'none'
      }
    };

    const startTime = Date.now();
    
    try {
      const info = await this.transporter.sendMail(mailOptions);
      const deliveryTime = Date.now() - startTime;
      
      emailJob.status = 'delivered';
      emailJob.deliveredAt = new Date();
      emailJob.messageId = info.messageId;
      emailJob.deliveryTime = deliveryTime;

      logger.info('Email delivered successfully', {
        emailId: emailJob.id,
        messageId: info.messageId,
        to: emailJob.to,
        subject: emailJob.subject,
        deliveryTime: `${deliveryTime}ms`,
        template: emailJob.template
      });

      // Audit log for important emails
      if (emailJob.auditLog) {
        await auditLog(
          emailJob.userId || 'system',
          'EMAIL_SENT',
          'notification',
          emailJob.id,
          null,
          {
            to: emailJob.to,
            subject: emailJob.subject,
            template: emailJob.template,
            messageId: info.messageId
          }
        );
      }

      return info;

    } catch (error) {
      const deliveryTime = Date.now() - startTime;
      
      logger.error('Email delivery failed', {
        emailId: emailJob.id,
        to: emailJob.to,
        subject: emailJob.subject,
        error: error.message,
        deliveryTime: `${deliveryTime}ms`,
        attempt: emailJob.attempts + 1
      });

      throw error;
    }
  }

  /**
   * Start queue processor
   */
  startQueueProcessor() {
    // Process queue every 10 seconds
    setInterval(() => {
      if (!this.isProcessing && this.emailQueue.length > 0) {
        this.processQueue();
      }
    }, 10000);
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user, temporaryPassword = null) {
    return this.sendTemplatedEmail('welcome', user.email, {
      subject: 'Welcome to LiveDisplay Enterprise',
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      temporaryPassword,
      loginUrl: `${process.env.APP_URL}/login`
    }, {
      auditLog: true,
      userId: user.id
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    
    return this.sendTemplatedEmail('password-reset', user.email, {
      subject: 'Password Reset Request',
      firstName: user.firstName,
      resetUrl,
      expiryHours: 24
    }, {
      auditLog: true,
      userId: user.id
    });
  }

  /**
   * Send leave request notification
   */
  async sendLeaveRequestNotification(leave, manager) {
    return this.sendTemplatedEmail('leave-request', manager.email, {
      subject: `Leave Request from ${leave.employee.firstName} ${leave.employee.lastName}`,
      managerName: manager.firstName,
      employeeName: `${leave.employee.firstName} ${leave.employee.lastName}`,
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason,
      approvalUrl: `${process.env.APP_URL}/leaves/${leave.id}`
    }, {
      auditLog: true,
      userId: leave.employeeId
    });
  }

  /**
   * Send room booking confirmation
   */
  async sendBookingConfirmation(booking, user) {
    return this.sendTemplatedEmail('booking-confirmation', user.email, {
      subject: `Room Booking Confirmed - ${booking.room.name}`,
      firstName: user.firstName,
      roomName: booking.room.name,
      date: booking.startTime.toDateString(),
      startTime: booking.startTime.toLocaleTimeString(),
      endTime: booking.endTime.toLocaleTimeString(),
      title: booking.title,
      bookingUrl: `${process.env.APP_URL}/bookings/${booking.id}`
    }, {
      auditLog: true,
      userId: user.id
    });
  }

  /**
   * Send visitor approval notification
   */
  async sendVisitorApprovalNotification(visitor, host) {
    return this.sendTemplatedEmail('visitor-approval', host.email, {
      subject: `Visitor Approval Required - ${visitor.name}`,
      hostName: host.firstName,
      visitorName: visitor.name,
      company: visitor.company,
      purpose: visitor.purpose,
      visitDate: visitor.visitDate,
      approvalUrl: `${process.env.APP_URL}/visitors/${visitor.id}`
    }, {
      auditLog: true,
      userId: host.id
    });
  }

  /**
   * Send system notification
   */
  async sendSystemNotification(users, subject, message, priority = 'medium') {
    const emails = Array.isArray(users) ? users : [users];
    const emailPromises = [];

    for (const user of emails) {
      const emailPromise = this.sendTemplatedEmail('system-notification', user.email, {
        subject,
        firstName: user.firstName,
        message,
        priority,
        dashboardUrl: `${process.env.APP_URL}/dashboard`
      }, {
        auditLog: true,
        userId: 'system'
      });

      emailPromises.push(emailPromise);
    }

    return Promise.all(emailPromises);
  }

  /**
   * Send bulk email
   */
  async sendBulkEmail(recipients, subject, template, data = {}) {
    const emailPromises = [];

    for (const recipient of recipients) {
      const emailPromise = this.sendTemplatedEmail(template, recipient.email, {
        ...data,
        subject,
        firstName: recipient.firstName,
        lastName: recipient.lastName
      });

      emailPromises.push(emailPromise);
    }

    return Promise.all(emailPromises);
  }

  /**
   * Get email statistics
   */
  getEmailStats() {
    return {
      queueSize: this.emailQueue.length,
      isProcessing: this.isProcessing,
      templatesLoaded: this.templates.size,
      transporterReady: !!this.transporter
    };
  }

  /**
   * Test email configuration
   */
  async testEmailConfig() {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    try {
      await this.transporter.verify();
      
      // Send test email
      const testEmail = await this.transporter.sendMail({
        from: this.defaultFrom,
        to: this.config.auth.user,
        subject: 'LiveDisplay Email Test',
        text: 'This is a test email from LiveDisplay Enterprise system.',
        html: '<p>This is a test email from <strong>LiveDisplay Enterprise</strong> system.</p>'
      });

      logger.info('Test email sent successfully', {
        messageId: testEmail.messageId
      });

      return {
        success: true,
        messageId: testEmail.messageId,
        message: 'Test email sent successfully'
      };

    } catch (error) {
      logger.error('Email test failed', {
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Shutting down email service...');
    
    // Wait for queue to process
    while (this.emailQueue.length > 0 && this.isProcessing) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (this.transporter) {
      this.transporter.close();
    }

    logger.info('Email service shutdown complete');
  }
}

// Create singleton instance
const emailService = new EmailService();

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  await emailService.shutdown();
});

process.on('SIGINT', async () => {
  await emailService.shutdown();
});

module.exports = {
  emailService,
  
  // Convenience functions
  sendEmail: (options) => emailService.sendEmail(options),
  sendTemplatedEmail: (template, to, data, options) => 
    emailService.sendTemplatedEmail(template, to, data, options),
  sendWelcomeEmail: (user, temporaryPassword) => 
    emailService.sendWelcomeEmail(user, temporaryPassword),
  sendPasswordResetEmail: (user, resetToken) => 
    emailService.sendPasswordResetEmail(user, resetToken),
  sendLeaveRequestNotification: (leave, manager) => 
    emailService.sendLeaveRequestNotification(leave, manager),
  sendBookingConfirmation: (booking, user) => 
    emailService.sendBookingConfirmation(booking, user),
  sendVisitorApprovalNotification: (visitor, host) => 
    emailService.sendVisitorApprovalNotification(visitor, host),
  sendSystemNotification: (users, subject, message, priority) => 
    emailService.sendSystemNotification(users, subject, message, priority),
  testEmailConfig: () => emailService.testEmailConfig()
};
