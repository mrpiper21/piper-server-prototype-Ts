import mongoose, { Document, Schema } from 'mongoose';

export interface ISupport extends Document {
	_id: string;
	message: string;
	response?: string;
    clientId: mongoose.Types.ObjectId;
    adminId: mongoose.Types.ObjectId;
    jobId: mongoose.Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const supportSchema = new Schema<ISupport>({
	clientId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Client",
		required: true,
	},
	adminId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	jobId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "PDFPrint",
		required: true,
	},
	message: {
		type: String,
		required: true,
	},
	response: {
		type: String,
		required: false,
	},
}, {
	timestamps: true,
});

const supportModel = mongoose.model<ISupport>("Support", supportSchema);
export default supportModel;