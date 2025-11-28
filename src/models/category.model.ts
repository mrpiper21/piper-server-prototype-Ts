import mongoose, { Document, Schema } from "mongoose";

export interface ICategory extends Document {
    name: string;
    unitPrice: number;
    description: string;
    adminId: mongoose.Types.ObjectId;
}

const categorySchema = new Schema<ICategory>({
    name: {
        type: String,
        required: true
    },
    unitPrice: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model<ICategory>("Category", categorySchema);