import mongoose, { Document, Schema } from 'mongoose';

export interface IRating extends Document {
    _id: string;
    averageRating: number; // Average of all star ratings (1-5)
    admin: mongoose.Types.ObjectId;
    reviews: Array<{
        _id?: mongoose.Types.ObjectId;
        stars: number; // 1-5 star rating
        comment?: string; // Optional comment
        client: mongoose.Types.ObjectId;
        createdAt?: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const ratingSchema = new Schema<IRating>(
    {
        averageRating: {
            type: Number,
            default: 0,
            min: [0, 'Average rating cannot be negative'],
            max: [5, 'Average rating cannot exceed 5']
        },
        admin: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Admin reference is required'],
            unique: true // One rating document per admin
        },
        reviews: [
            {
                stars: {
                    type: Number,
                    required: [true, 'Star rating is required'],
                    min: [1, 'Rating must be at least 1 star'],
                    max: [5, 'Rating cannot exceed 5 stars']
                },
                comment: {
                    type: String,
                    required: false,
                    trim: true,
                    maxlength: [500, 'Comment cannot exceed 500 characters']
                },
                client: {
                    type: Schema.Types.ObjectId,
                    ref: 'Client',
                    required: [true, 'Client reference is required']
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Index for better query performance
ratingSchema.index({ admin: 1 });
ratingSchema.index({ 'reviews.client': 1 });

// Create and export the model
const Rating = mongoose.model<IRating>('Rating', ratingSchema);

export default Rating;