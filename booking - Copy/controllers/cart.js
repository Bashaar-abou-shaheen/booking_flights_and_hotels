const { validationResult } =require('express-validator')
const FlightBooking = require('../models/flight/flightBooking')
const HotelBooking = require('../models/hotel/hotelBooking')
const Payment = require('../models/payment')


exports.getAllReservations = async (req, res, next) => {
    try {
        const userId = req.userId;
        let finalPrice = 0;

        const responseData = { flights: [], hotels: [] };

        const flights = await FlightBooking.find({ user: userId }).populate("seatNumbers flight");

        const formattedFlights = flights.map(flightBooking => {
            const { seatNumbers, flight, price } = flightBooking;
            const formattedSeatNumbers = seatNumbers.map(seat => seat.seatNumber);
            finalPrice += price;

            return {
                ...flightBooking._doc,
                user :undefined ,
                flight: flight.flightNumber,
                seatNumbers: formattedSeatNumbers
            };
        });

        responseData.flights = formattedFlights;


        const hotels = await HotelBooking.find({ user: userId }).populate("roomNumbers hotel");

        const formattedHotels = hotels.map(hotelBooking => {
            const { roomNumbers, hotel, price } = hotelBooking;
            const formattedRoomNumbers = roomNumbers.map(room => room.roomNumber);
            finalPrice += price;

            return {
                ...hotelBooking._doc,
                user :undefined ,
                hotel: hotel.name,
                roomNumbers: formattedRoomNumbers
            };
        });

        responseData.hotels = formattedHotels;

        if (responseData.flights.length === 0 && responseData.hotels.length === 0) {
            return res.status(404).json({ message: "You don't have reservations" });
        }

        res.status(200).json({ message: 'Success', finalPrice, ...responseData });

    } catch (err) {
        err.statusCode = err.statusCode || 500;
        next(err);
    }
};


const createPayment = async ({ userId, bookingType, bookingId, paymentMethod }) => {
    const payment = new Payment({
        user: userId,
        bookingType: bookingType,
        [`${bookingType}Booking`]: bookingId,
        date: Date.now(),
        method: paymentMethod
    });
    await payment.save();
};

const findBookingById = async (bookingType, bookingId) => {
    if (bookingType === 'flight') {
        return await FlightBooking.findById(bookingId);
    } else if (bookingType === 'hotel') {
        return await HotelBooking.findById(bookingId);
    }
    return null;
};

exports.pay = async (req, res, next) => {
    try {
        const { userId } = req;
        const { bookingType, hotelBooking, flightBooking, paymentMethod } = req.body;

        switch (bookingType) {
            case 'flight': {
                const currFlightBooking = await findBookingById(bookingType, flightBooking);
                if (!currFlightBooking) {
                    return res.status(404).json({ message: `Flight booking ${flightBooking} not found` });
                }
                
                await createPayment({ userId, bookingType, bookingId: flightBooking, paymentMethod });
                return res.status(200).json({ message: 'Payment successful' });
            }
            
            case 'hotel': {
                const currHotelBooking = await findBookingById(bookingType, hotelBooking);
                
                if (!currHotelBooking) {
                    return res.status(404).json({ message: `Hotel booking ${hotelBooking} not found` });
                }

                await createPayment({ userId, bookingType, bookingId: hotelBooking, paymentMethod });
                return res.status(200).json({ message: 'Payment successful' });
            }

            case 'package': {
                const currFlightBooking = await findBookingById('flight', flightBooking);
                const currHotelBooking = await findBookingById('hotel', hotelBooking);

                if (!currFlightBooking) {
                    return res.status(404).json({ message: `Flight booking ${flightBooking} not found` });
                }

                if (!currHotelBooking) {
                    return res.status(404).json({ message: `Hotel booking ${hotelBooking} not found` });
                }

                await createPayment({ userId, bookingType: 'hotel', bookingId: hotelBooking, paymentMethod });
                await createPayment({ userId, bookingType: 'flight', bookingId: flightBooking, paymentMethod });
                return res.status(200).json({ message: 'Payment successful' });
            }

            default:
                return res.status(400).json({ message: `Invalid booking type: ${bookingType}` });
        }
    } catch (err) {
        err.statusCode = err.statusCode || 500;
        next(err);
    }
};