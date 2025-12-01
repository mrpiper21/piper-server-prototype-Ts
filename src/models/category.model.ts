import mongoose, { Document, Schema } from "mongoose";

export type ICategoryType =
	| "wassce_result"
	| "bece_result"
	| "novdec_result"
	| "large_format"
	| "regular_format";

export type IRegularFormatProperties = "front_only" | "front_and_back";

export interface ICategory extends Document {
	name: string;
	unitPrice: number;
	description: string;
	adminId: mongoose.Types.ObjectId;
	categoryType: ICategoryType;
	regularFormatProperties: IRegularFormatProperties;
}

const categorySchema = new Schema<ICategory>(
	{
		name: {
			type: String,
			required: true,
		},
		unitPrice: {
			type: Number,
			required: true,
		},
		description: {
			type: String,
			required: false,
		},
		adminId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		categoryType: {
			type: String,
			enum: [
				"wassce_result",
				"bece_result",
				"novdec_result",
				"large_format",
				"regular_format",
			],
			required: false,
		},
		regularFormatProperties: {
			type: String,
			enum: ["front_only", "front_and_back"],
			required: false,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

export default mongoose.model<ICategory>("Category", categorySchema);