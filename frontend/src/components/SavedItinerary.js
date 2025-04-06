import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Container, Card, Button, ListGroup } from "react-bootstrap";
import { Navbar, Nav } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";

const SavedItinerary = () => {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const [itinerary, setItinerary] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();       // Clear user session
    navigate("/");  // Redirect to homepage
  };

  useEffect(() => {
    const fetchItinerary = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await axios.get(
          `http://localhost:5000/api/itineraries/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setItinerary(res.data);
        console.log("Fetched itinerary:", res.data);
      } catch (err) {
        console.error("❌ Error loading itinerary:", err);
        setError("Itinerary not found or you don’t have access.");
      }
    };

    fetchItinerary();
  }, [id, navigate]);

  if (error) return <div className="text-center p-4 text-danger">{error}</div>;
  if (!itinerary) return <div className="text-center p-4">Loading...</div>;

  const sortedDays = Object.entries(itinerary.days || {}).sort(([a], [b]) => {
    const dayA = parseInt(a.replace(/[^\d]/g, ""), 10);
    const dayB = parseInt(b.replace(/[^\d]/g, ""), 10);
    return dayA - dayB;
  });

  return (
    <>
          {/* Navbar */}
          <Navbar style={{ backgroundColor: "#e9ecef" }} expand="lg" className="shadow-sm py-2">
                  
                    <Container>
                    <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
                    <img
                      src="/logo.png"
                      alt="TravelWorld Logo"
                      width="50"
                      height="50"
                      className="d-inline-block align-top me-2"
                    />
                    <span className="fs-2 fw-bold">TravelWorld</span>
                  </Navbar.Brand>
                  
                      <Navbar.Toggle aria-controls="basic-navbar-nav" />
                      <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto align-items-center">
                          <Nav.Link as={Link} to="/" className="fs-5">Home</Nav.Link>
                          <Nav.Link as={Link} to="/trip-planner" className="fs-5">Trip Planner</Nav.Link>
                          <Nav.Link as={Link} to="/gallery" className="fs-5">Gallery</Nav.Link>
                          <Nav.Link as={Link} to="/feedback" className="fs-5">Feedback</Nav.Link>
                          {user ? (
                            <>
                              <Nav.Link as={Link} to="/profile" className="fs-5">Profile</Nav.Link>
                              <Button
                                variant="outline-danger"
                                onClick={handleLogout}
                                className="ms-2 fs-6 fw-semibold"
                              >
                                Logout
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                as={Link}
                                to="/login"
                                variant="outline-primary"
                                className="ms-2 fs-6 fw-semibold"
                              >
                                Login
                              </Button>
                              <Button
                                as={Link}
                                to="/register"
                                variant="primary"
                                className="ms-2 fs-6 fw-semibold"
                              >
                                Register
                              </Button>
                            </>
                          )}
                        </Nav>
                      </Navbar.Collapse>
                    </Container>
                  </Navbar>

    <Container className="py-5">
      <Card className="p-4 shadow-sm">
        <h2 className="mb-3">{itinerary.destination}</h2>
        <p>
          <strong>Trip Name:</strong> {itinerary.trip}
        </p>
        <p>
          <strong>From:</strong>{" "}
          {new Date(itinerary.startDate).toLocaleDateString()}
        </p>
        <p>
          <strong>To:</strong>{" "}
          {new Date(itinerary.endDate).toLocaleDateString()}
        </p>
        <p>
          <strong>Total Days:</strong>{" "}
          {Object.keys(itinerary.days || {}).length}
        </p>

        {sortedDays.length > 0 ? (
          <div className="mt-4">
            <h4>Day-wise Itinerary:</h4>
            {sortedDays.map(([dayLabel, activities], index) => (
              <Card key={index} className="mb-3 p-3">
                <h5>{dayLabel}</h5>
                {activities.length > 0 ? (
                  <ListGroup variant="flush">
                    {activities.map((activity, i) => (
                      <ListGroup.Item key={i}>
                        {typeof activity === "object" ? (
                          activity?.properties?.name?.trim() ? (
                            activity.properties.name
                          ) : (
                            <a
                              href={`https://www.openstreetmap.org/${activity.properties.osm}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Unnamed Place
                            </a>
                          )
                        ) : (
                          activity
                        )}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <p className="text-muted">No activities listed.</p>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <p>No day-wise breakdown available.</p>
        )}

        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          className="mt-3"
        >
          Back
        </Button>
      </Card>
    </Container>
    </>
  );
};

export default SavedItinerary;
