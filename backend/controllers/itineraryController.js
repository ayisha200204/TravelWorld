const { getDestinationCoordinates, fetchPlaces } = require("../services/openTripMapService");
const Itinerary = require("../models/Itinerary");
const Trip = require("../models/tripModel");
const axios = require("axios");   
const mongoose = require("mongoose"); 

/**
 * Generate an itinerary based on user preferences
 */
const generateItinerary = async (req, res) => {
    try {
        const { tripId } = req.params; // Get the tripId from the URL params
        const trip = await Trip.findById(tripId); // Find the trip based on the tripId

        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }

        // Generate the itinerary here
        const newItinerary = new Itinerary({
            trip: trip._id,
            destination: trip.destination,
            // Add any other relevant fields here
        });

        await newItinerary.save(); // Save the new itinerary to the database

        // Respond with the Itinerary ID
        res.status(200).json({ itineraryId: newItinerary._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const createItineraryFromTrip = async (req, res) => {
    try {
        const { id } = req.params;
        const tripId = new mongoose.Types.ObjectId(id);

        console.log(`Creating itinerary for tripId: ${tripId}`);

        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }

        const { destination, startDate, endDate, interests, budget } = trip;
        if (!destination || !startDate || !endDate || !budget || !interests || interests.length === 0) {
            return res.status(400).json({ message: "Trip details are incomplete." });
        }

        const userId = req.user.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: No user found." });
        }

        // Get coordinates
        const locationData = await getDestinationCoordinates(destination);
        if (!locationData.lat || !locationData.lon) {
            return res.status(400).json({ message: "Invalid destination." });
        }

        const { lat, lon } = locationData;
        console.log("Fetching places for:", { lat, lon, interests });

        const allPlacesByInterest = {};

        // 🔄 Fetch and filter places for each interest
        for (const interest of interests) {
            let interestPlaces = await fetchPlaces(lat, lon, [interest]);

            // 🧹 Budget-based filtering
            if (budget === "low") {
                interestPlaces = interestPlaces.filter(place =>
                    !place.properties.kinds.includes("shops") &&
                    !place.properties.kinds.includes("theatres_and_entertainments")
                );
            } else if (budget === "medium") {
                interestPlaces = interestPlaces.filter(place =>
                    !place.properties.kinds.includes("theatres_and_entertainments")
                );
            }

            // 🔀 Shuffle to avoid repeated categories each day
            allPlacesByInterest[interest] = interestPlaces.sort(() => 0.5 - Math.random());
        }

        // ✅ Create balanced itinerary
        const numDays = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
        const maxPlacesPerDay = budget === "low" ? 3 : budget === "medium" ? 4 : 5;
        const itinerary = {};

        for (let i = 0; i < numDays; i++) {
            const dayKey = `Day ${i + 1}`;
            itinerary[dayKey] = [];

            let placeCount = 0;

            // 1. Try to pick one place from each interest
            for (const interest of interests) {
                const interestPlaces = allPlacesByInterest[interest] || [];
                if (interestPlaces.length > 0 && placeCount < maxPlacesPerDay) {
                    const place = interestPlaces.shift();
                    itinerary[dayKey].push(place);
                    placeCount++;
                }
            }

            // 2. Fill remaining with any leftover places from any interest
            while (placeCount < maxPlacesPerDay) {
                for (const interest of interests) {
                    const interestPlaces = allPlacesByInterest[interest] || [];
                    if (interestPlaces.length > 0 && placeCount < maxPlacesPerDay) {
                        const place = interestPlaces.shift();
                        itinerary[dayKey].push(place);
                        placeCount++;
                    }
                }
                // Break loop if no more places left
                const totalRemaining = interests.reduce((sum, i) => sum + (allPlacesByInterest[i]?.length || 0), 0);
                if (totalRemaining === 0) break;
            }
        }

        const savedItinerary = new Itinerary({
            user: new mongoose.Types.ObjectId(userId),
            trip: tripId,
            destination,
            startDate,
            endDate,
            days: itinerary,
        });

        await savedItinerary.save();

        res.status(201).json({ itineraryId: savedItinerary._id });
    } catch (error) {
        console.error("Error creating itinerary:", error);
        res.status(500).json({ message: "Failed to create itinerary." });
    }
};



/**
 * Sort places by distance from the first place
 */
function sortPlacesByDistance(places) {
    function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of Earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }

    const base = places[0]; // Reference place
    return places.sort((a, b) => {
        return getDistance(
            base.geometry.coordinates[1], base.geometry.coordinates[0],
            a.geometry.coordinates[1], a.geometry.coordinates[0]
        ) - getDistance(
            base.geometry.coordinates[1], base.geometry.coordinates[0],
            b.geometry.coordinates[1], b.geometry.coordinates[0]
        );
    });
}


//   Fetch itineraries for the logged-in user
const getUserItineraries = async (req, res) => {
    try {
        const itineraries = await Trip.find({ user: req.user._id });
        res.json(itineraries);
    } catch (error) {
        console.error("Error fetching itineraries:", error.message);
        res.status(500).json({ message: "Failed to fetch itineraries." });
    }
};


module.exports = { generateItinerary, getUserItineraries,createItineraryFromTrip };