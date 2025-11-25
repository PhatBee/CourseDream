import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    priceDiscount: {
        type: Number,
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const CartSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Mỗi user chỉ có 1 cart
    },
    items: [CartItemSchema],
    totalItems: {
        type: Number,
        default: 0
    },
    subtotal: {
        type: Number,
        default: 0
    },
    totalDiscount: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Method để tính toán lại tổng tiền
CartSchema.methods.calculateTotals = function () {
    this.totalItems = this.items.length;
    this.subtotal = this.items.reduce((sum, item) => sum + item.price, 0);
    this.total = this.items.reduce((sum, item) => sum + item.priceDiscount, 0);
    this.totalDiscount = this.subtotal - this.total;
    return this;
};

// Index để tìm course trong cart
CartSchema.index({ 'items.course': 1 });

export default mongoose.model('Cart', CartSchema);
