import React, { useState, useEffect } from "react";
import {
  Navbar,
  Nav,
  Container,
  Button,
  Card,
  Row,
  Col,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

const Profile = () => {
  const { user, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [savedItineraries, setSavedItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();       // Clear user session
    navigate("/");  // Redirect to homepage
  };
  
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        console.log("❌ No token found in localStorage");
        setError("User not authenticated.");
        setLoading(false);
        navigate("/login");
        return;
      }

      try {
        // Fetch user info
        const userRes = await axios.get("http://localhost:5000/api/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUserData(userRes.data);
        console.log("✅ User data:", userRes.data);

        // Fetch saved itineraries
        const itinRes = await axios.get(
          "http://localhost:5000/api/itineraries/mine",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        //setSavedItineraries(itinRes.data);
        const uniqueItineraries = Array.from(
          new Map(
            itinRes.data.map((item) => [
              `${item.destination}-${item.startDate}-${item.endDate}`,
              item,
            ])
          ).values()
        );
        setSavedItineraries(uniqueItineraries);

        console.log("📦 Itineraries fetched:", itinRes.data);
      } catch (error) {
        console.error("🚨 Error fetching data:", error);
        setError("Failed to load profile data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  if (loading)
    return <div className="text-center p-6">Loading user data...</div>;
  if (error) return <div className="text-center p-6 text-danger">{error}</div>;

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

      <div className="min-h-screen bg-light p-4">
        {/* Profile Info */}
        <div className="bg-white shadow-sm p-4 rounded-lg mb-5 max-w-lg mx-auto text-center">
          <h2 className="text-2xl fw-bold text-dark">{userData?.name}</h2>
          <p className="text-secondary">{userData?.email}</p>
        </div>

        {/* Saved Itineraries */}
        <div className="max-w-4xl mx-auto">
          <h3 className="mb-4 fw-semibold">Your Saved Itineraries</h3>
          {savedItineraries.length === 0 ? (
            <p className="text-muted">You haven't saved any itineraries yet.</p>
          ) : (
            <Row xs={1} md={2} className="g-4">
              {savedItineraries.map((itinerary) => (
                <Col key={itinerary._id}>
                  <Card className="shadow-sm h-100">
                    <Card.Body>
                      <Card.Title>{itinerary.destination}</Card.Title>
                      <Card.Text>
                        From:{" "}
                        {new Date(itinerary.startDate).toLocaleDateString()}{" "}
                        <br />
                        To: {new Date(itinerary.endDate).toLocaleDateString()}
                      </Card.Text>
                      <Button
                        as={Link}
                        to={`/saved-itinerary/${itinerary._id}`}
                        variant="primary"
                      >
                        View
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;