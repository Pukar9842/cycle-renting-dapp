import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Button,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { useWeb3 } from "../context/Web3Context";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import {
  FaBicycle,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaTools,
} from "react-icons/fa";

const MyRentals = () => {
  const { contract, account, isConnected } = useWeb3();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returningRental, setReturningRental] = useState(null);
  const [reportingRental, setReportingRental] = useState(null);
  const [issueDescription, setIssueDescription] = useState("");
  const [expiredRentals, setExpiredRentals] = useState(new Set());
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedRental, setSelectedRental] = useState(null);
  const chakraToast = useToast();

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    if (contract && isConnected && account) {
      loadRentals();
    }
  }, [contract, isConnected, account]);

  // Check for expired rentals every minute
  useEffect(() => {
    const checkExpiredRentals = () => {
      const now = new Date();
      const expired = new Set();

      rentals.forEach((rental) => {
        if (rental.isActive && !rental.isReturned && now > rental.endTime) {
          expired.add(rental.id);
        }
      });

      setExpiredRentals(expired);

      // Show toast for newly expired rentals
      expired.forEach((rentalId) => {
        const rental = rentals.find((r) => r.id === rentalId);
        if (rental) {
          chakraToast({
            title: "Rental Time Expired!",
            description: `Your rental for ${rental.cycleName} has expired. Please return the cycle.`,
            status: "warning",
            duration: 10000,
            isClosable: true,
            position: "top-right",
          });
        }
      });
    };

    if (rentals.length > 0) {
      checkExpiredRentals();
      const interval = setInterval(checkExpiredRentals, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [rentals, chakraToast]);

  const loadRentals = async () => {
    try {
      setLoading(true);
      const rentalIds = await contract.getUserRentals(account);

      const rentalsData = [];

      for (const rentalId of rentalIds) {
        const rental = await contract.getRental(rentalId);
        const cycle = await contract.getCycle(rental.cycleId);

        // Get issue report if exists
        let issueReport = null;
        try {
          issueReport = await contract.getIssueReport(rentalId);
        } catch (error) {
          // No issue report exists
        }

        rentalsData.push({
          id: rental.id.toString(),
          cycleId: rental.cycleId.toString(),
          cycleName: cycle.name,
          cycleImage: cycle.imageUrl,
          startTime: new Date(Number(rental.startTime) * 1000),
          endTime: new Date(Number(rental.endTime) * 1000),
          totalCost: ethers.formatEther(rental.totalCost),
          isActive: rental.isActive,
          isReturned: rental.isReturned,
          hasIssueReported: rental.hasIssueReported,
          issueReport: issueReport,
        });
      }

      // Sort by start time (newest first)
      rentalsData.sort((a, b) => b.startTime - a.startTime);
      setRentals(rentalsData);
    } catch (error) {
      console.error("Error loading rentals:", error);
      toast.error("Failed to load rentals");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnCycle = async (rentalId) => {
    try {
      setReturningRental(rentalId);
      const tx = await contract.returnCycle(rentalId);

      toast.promise(tx.wait(), {
        loading: "Processing return...",
        success: "Cycle returned successfully!",
        error: "Failed to return cycle",
      });

      await tx.wait();
      loadRentals();
    } catch (error) {
      console.error("Error returning cycle:", error);
      toast.error(error.message || "Failed to return cycle");
    } finally {
      setReturningRental(null);
    }
  };

  const handleReportIssue = async () => {
    if (!issueDescription.trim()) {
      toast.error("Please provide a description of the issue");
      return;
    }

    try {
      setReportingRental(selectedRental.id);
      const tx = await contract.reportIssue(
        selectedRental.id,
        issueDescription
      );

      toast.promise(tx.wait(), {
        loading: "Reporting issue...",
        success:
          "Issue reported successfully! You will be notified about refund processing.",
        error: "Failed to report issue",
      });

      await tx.wait();
      loadRentals();
      onClose();
      setIssueDescription("");
      setSelectedRental(null);
    } catch (error) {
      console.error("Error reporting issue:", error);
      toast.error(error.message || "Failed to report issue");
    } finally {
      setReportingRental(null);
    }
  };

  const openReportModal = (rental) => {
    setSelectedRental(rental);
    setIssueDescription("");
    onOpen();
  };

  const formatDate = (date) => {
    return date.toLocaleString();
  };

  const formatDuration = (startTime, endTime) => {
    const duration = endTime - startTime;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const isRentalOverdue = (endTime) => {
    return new Date() > endTime;
  };

  const getRentalStatus = (rental) => {
    if (rental.isReturned) {
      return { status: "Returned", color: "green" };
    } else if (rental.isActive) {
      if (isRentalOverdue(rental.endTime)) {
        return { status: "Overdue", color: "red" };
      } else {
        return { status: "Active", color: "blue" };
      }
    } else {
      return { status: "Completed", color: "gray" };
    }
  };

  const activeRentals = rentals.filter(
    (rental) => rental.isActive && !rental.isReturned
  );
  const completedRentals = rentals.filter(
    (rental) => !rental.isActive || rental.isReturned
  );

  if (!isConnected) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} textAlign="center">
          <Heading>My Rentals</Heading>
          <Alert status="warning">
            <AlertIcon />
            Please connect your wallet to view your rentals
          </Alert>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <VStack spacing={4} textAlign="center">
          <Heading>My Rentals</Heading>
          <Text color="gray.600">
            Track your cycle rental history and manage active rentals
          </Text>
        </VStack>

        {loading ? (
          <VStack spacing={4} py={12}>
            <Spinner size="xl" color="brand.500" />
            <Text>Loading your rentals...</Text>
          </VStack>
        ) : (
          <Tabs variant="enclosed">
            <TabList>
              <Tab>Active Rentals ({activeRentals.length})</Tab>
              <Tab>Rental History ({completedRentals.length})</Tab>
            </TabList>

            <TabPanels>
              {/* Active Rentals */}
              <TabPanel>
                {activeRentals.length === 0 ? (
                  <VStack spacing={4} py={12}>
                    <Text fontSize="lg" color="gray.600">
                      You don't have any active rentals
                    </Text>
                    <Button
                      as="a"
                      href="/browse"
                      colorScheme="brand"
                      leftIcon={<FaBicycle />}
                    >
                      Browse Cycles
                    </Button>
                  </VStack>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {activeRentals.map((rental) => {
                      const status = getRentalStatus(rental);
                      const isExpired = expiredRentals.has(rental.id);

                      return (
                        <Box
                          key={rental.id}
                          bg={bg}
                          borderWidth="1px"
                          borderColor={borderColor}
                          borderRadius="lg"
                          p={6}
                          shadow="md"
                        >
                          <VStack spacing={4} align="stretch">
                            <HStack justify="space-between">
                              <Text fontSize="lg" fontWeight="bold">
                                {rental.cycleName}
                              </Text>
                              <Badge colorScheme={status.color}>
                                {status.status}
                              </Badge>
                            </HStack>

                            <Box>
                              <Text fontSize="sm" color="gray.600">
                                <strong>Start:</strong>{" "}
                                {formatDate(rental.startTime)}
                              </Text>
                              <Text fontSize="sm" color="gray.600">
                                <strong>End:</strong>{" "}
                                {formatDate(rental.endTime)}
                              </Text>
                              <Text fontSize="sm" color="gray.600">
                                <strong>Duration:</strong>{" "}
                                {formatDuration(
                                  rental.startTime,
                                  rental.endTime
                                )}
                              </Text>
                              <Text fontSize="sm" color="gray.600">
                                <strong>Cost:</strong> {rental.totalCost} ETH
                              </Text>
                            </Box>

                            {/* Time Alert */}
                            {isExpired && (
                              <Alert status="error" size="sm">
                                <AlertIcon />
                                <Text fontSize="xs">
                                  ⏰ RENTAL TIME EXPIRED! Please return the
                                  cycle immediately.
                                </Text>
                              </Alert>
                            )}

                            {/* Issue Report Status */}
                            {rental.hasIssueReported && (
                              <Alert status="info" size="sm">
                                <AlertIcon />
                                <Text fontSize="xs">
                                  🛠️ Issue reported. Refund processing
                                  initiated.
                                </Text>
                              </Alert>
                            )}

                            <VStack spacing={2}>
                              {rental.isActive &&
                                !rental.isReturned &&
                                !rental.hasIssueReported && (
                                  <Button
                                    colorScheme="brand"
                                    onClick={() => handleReturnCycle(rental.id)}
                                    isLoading={returningRental === rental.id}
                                    loadingText="Returning..."
                                    leftIcon={<FaCheckCircle />}
                                    isDisabled={new Date() < rental.endTime}
                                    size="sm"
                                  >
                                    {new Date() < rental.endTime
                                      ? "Return After End Time"
                                      : "Return Cycle"}
                                  </Button>
                                )}

                              {rental.isActive &&
                                !rental.isReturned &&
                                !rental.hasIssueReported && (
                                  <Button
                                    colorScheme="orange"
                                    variant="outline"
                                    onClick={() => openReportModal(rental)}
                                    isLoading={reportingRental === rental.id}
                                    loadingText="Reporting..."
                                    leftIcon={<FaExclamationTriangle />}
                                    size="sm"
                                  >
                                    Report Issue
                                  </Button>
                                )}
                            </VStack>

                            {isRentalOverdue(rental.endTime) && !isExpired && (
                              <Alert status="warning" size="sm">
                                <AlertIcon />
                                <Text fontSize="xs">
                                  This rental is overdue. Please return the
                                  cycle as soon as possible.
                                </Text>
                              </Alert>
                            )}
                          </VStack>
                        </Box>
                      );
                    })}
                  </SimpleGrid>
                )}
              </TabPanel>

              {/* Rental History */}
              <TabPanel>
                {completedRentals.length === 0 ? (
                  <VStack spacing={4} py={12}>
                    <Text fontSize="lg" color="gray.600">
                      No rental history yet
                    </Text>
                    <Button
                      as="a"
                      href="/browse"
                      colorScheme="brand"
                      leftIcon={<FaBicycle />}
                    >
                      Start Renting
                    </Button>
                  </VStack>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {completedRentals.map((rental) => {
                      const status = getRentalStatus(rental);
                      return (
                        <Box
                          key={rental.id}
                          bg={bg}
                          borderWidth="1px"
                          borderColor={borderColor}
                          borderRadius="lg"
                          p={6}
                          shadow="md"
                        >
                          <VStack spacing={4} align="stretch">
                            <HStack justify="space-between">
                              <Text fontSize="lg" fontWeight="bold">
                                {rental.cycleName}
                              </Text>
                              <Badge colorScheme={status.color}>
                                {status.status}
                              </Badge>
                            </HStack>

                            <Box>
                              <Text fontSize="sm" color="gray.600">
                                <strong>Start:</strong>{" "}
                                {formatDate(rental.startTime)}
                              </Text>
                              <Text fontSize="sm" color="gray.600">
                                <strong>End:</strong>{" "}
                                {formatDate(rental.endTime)}
                              </Text>
                              <Text fontSize="sm" color="gray.600">
                                <strong>Duration:</strong>{" "}
                                {formatDuration(
                                  rental.startTime,
                                  rental.endTime
                                )}
                              </Text>
                              <Text fontSize="sm" color="gray.600">
                                <strong>Cost:</strong> {rental.totalCost} ETH
                              </Text>
                            </Box>

                            {rental.hasIssueReported && rental.issueReport && (
                              <Alert status="info" size="sm">
                                <AlertIcon />
                                <Text fontSize="xs">
                                  🛠️ Issue was reported and refund was
                                  processed.
                                </Text>
                              </Alert>
                            )}
                          </VStack>
                        </Box>
                      );
                    })}
                  </SimpleGrid>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </VStack>

      {/* Issue Report Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Report Issue with {selectedRental?.cycleName}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text fontSize="sm" color="gray.600">
                Please describe the issue you encountered with the cycle. This
                will help us process your refund quickly.
              </Text>
              <Textarea
                placeholder="Describe the issue (e.g., flat tire, broken chain, etc.)"
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                rows={4}
              />
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="orange"
              onClick={handleReportIssue}
              isLoading={reportingRental === selectedRental?.id}
              loadingText="Reporting..."
              leftIcon={<FaExclamationTriangle />}
            >
              Report Issue
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default MyRentals;
