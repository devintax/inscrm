import mongoose from "mongoose"

const Lead = new mongoose.Schema({
    title: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: String },
    gender: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    emailAddress: { type: String, required: true },
    address: { type: String },
    leadSource: { type: String },
    leadStatus: { type: String, default: 'New' },
    leadScore: { type: Number, default: 2 },
    alternatePhoneNumber: { type: String },
    additionalEmailAddress: { type: String },
    instagramProfile: { type: String },
    twitterProfile: { type: String },
    assigned_agent: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
    },
    typeOfInsurance: { type: String },
    desiredCoverageAmount: { type: Number },
    specificPolicyFeatures: { type: String },
    QualificationStatus: { type: String },
    policyType: { type: String },
    policyNumber: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    coverageAmount: { type: Number },
    termLength: { type: String },
    conversionReason: { type: String },
    conversionDateTime: { type: String },
    leadCategory: { type: String },
    leadPriority: { type: String },
    contact_id: {
        type: mongoose.Schema.ObjectId,
        ref: "Contacts",
        require: true
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    },
    deleted: {
        type: Boolean,
        default: false,
    },
    createdOn: { type: Date, default: Date.now },
    modifiedOn: { type: Date, default: Date.now }
    ,externalSourceId: { type: String, index: true }
    ,fullName: { type: String }
    ,sourceCreatedAt: { type: Date, index: true }
    ,driversLicense: String
    ,phoneHome: String
    ,phoneCellWork: String
    ,city: String
    ,state: String
    ,zip: String
    ,maritalStatus: String
    ,housingStatus: String
    ,licensedOver3Years: Boolean
    ,driversInHousehold: Number
    ,driver2: {
        firstName: String, lastName: String, dateOfBirth: Date, driversLicense: String,
        excluded: Boolean, defensiveDriving: String
    }
    ,hasCurrentInsurance: Boolean
    ,currentInsuranceCompany: String
    ,coverageType: String
    ,coverageStartDate: Date
    ,hasLienHolder: Boolean
    ,lienHolderName: String
    ,vehicles: [{ year: Number, make: String, model: String, vin: String, bodyType: String }]
    ,hasViolations: Boolean
    ,violations: [{ type: String, date: Date }]
    ,referralSource: String
    ,dateOfInquiry: Date
    ,consent: { granted: Boolean, timestamp: Date, text: String, ipAddress: String }
    ,externalData: { type: mongoose.Schema.Types.Mixed, default: {} }
    ,duplicateSubmissions: [{ receivedAt: Date, source: String, externalSourceId: String }]

})

Lead.index({ emailAddress: 1, createdOn: -1 });
Lead.index({ phoneNumber: 1, createdOn: -1 });
Lead.index({ phoneHome: 1, createdOn: -1 });
Lead.index({ phoneCellWork: 1, createdOn: -1 });
 
export default mongoose.model('Lead', Lead)
