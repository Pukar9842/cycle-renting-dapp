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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import { useWeb3 } from "../context/Web3Context";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import {
  FaTools,
  FaCheckCircle,
  FaExclamationTriangle,
  FaMoneyBillWave,
} from "react-icons/fa";

const Admin = () => {
  const { contract, account, isConnected } = useWeb3();
  const [issueReports, setIssueReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingRefund, setProcessingRefund] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedReport, setSelectedReport] = useState(null);
  const chakraToast = useToast();

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    if (contract && isConnected && account) {
      loadIssueReports();
    }
  }, [contract, isConnected, account]);

  const loadIssueReports = async () => {
    try {
      setLoading(true);
      const totalRentals = await contract.getTotalRentals();
      const reports = [];

      // Check all rentals for issue reports
      for (let i = 1; i <= totalRentals; i++) {
        try {
          const rental = await contract.getRental(i);
          if (rental.hasIssueReported) {
            const issueReport = await contract.getIssueReport(i);
            const cycle = await contract.getCycle(rental.cycleId);

            reports.push({
              rentalId: i,
              cycleName: cycle.name,
              renter: rental.renter,
              description: issueReport.description,
              reportTime: new Date(Number(issueReport.reportTime) * 1000),
              isResolved: issueReport.isResolved,
              refundProcessed: issueReport.refundProcessed,
              totalCost: ethers.formatEther(rental.totalCost),
            });
          }
        } catch (error) {
          // Skip if rental doesn't exist or no issue report
        }
      }

      // Sort by report time (newest first)
      reports.sort((a, b) => b.reportTime - a.reportTime);
      setIssueReports(reports);
    } catch (error) {
      console.error("Error loading issue reports:", error);
      toast.error("Failed to load issue reports");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async (rentalId) => {
    try {
      setProcessingRefund(rentalId);
      const tx = await contract.processRefund(rentalId);

      toast.promise(tx.wait(), {
        loading: "Processing refund...",
        success: "Refund processed successfully!",
        error: "Failed to process refund",
      });

      await tx.wait();
      loadIssueReports();

      chakraToast({
        title: "Refund Processed",
        description: `Refund has been sent to the user's account.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error processing refund:", error);
      toast.error(error.message || "Failed to process refund");
    } finally {
      setProcessingRefund(null);
    }
  };

  const openReportDetails = (report) => {
    setSelectedReport(report);
    onOpen();
  };

  const formatDate = (date) => {
    return date.toLocaleString();
  };

  if (!isConnected) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} textAlign="center">
          <Heading>Admin Panel</Heading>
          <Alert status="warning">
            <AlertIcon />
            Please connect your wallet to access admin functions
          </Alert>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <VStack spacing={4} textAlign="center">
          <Heading>Admin Panel</Heading>
          <Text color="gray.600">Manage issue reports and process refunds</Text>
        </VStack>

        {loading ? (
          <VStack spacing={4} py={12}>
            <Spinner size="xl" color="brand.500" />
            <Text>Loading issue reports...</Text>
          </VStack>
        ) : (
          <Box>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between">
                <Heading size="md">
                  Issue Reports ({issueReports.length})
                </Heading>
                <Button
                  colorScheme="brand"
                  onClick={loadIssueReports}
                  size="sm"
                >
                  Refresh
                </Button>
              </HStack>

              {issueReports.length === 0 ? (
                <VStack spacing={4} py={12}>
                  <Text fontSize="lg" color="gray.600">
                    No issue reports found
                  </Text>
                </VStack>
              ) : (
                <Box
                  bg={bg}
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="lg"
                  overflow="hidden"
                >
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Rental ID</Th>
                        <Th>Cycle</Th>
                        <Th>Renter</Th>
                        <Th>Issue Description</Th>
                        <Th>Reported</Th>
                        <Th>Status</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {issueReports.map((report) => (
                        <Tr key={report.rentalId}>
                          <Td fontWeight="bold">#{report.rentalId}</Td>
                          <Td>{report.cycleName}</Td>
                          <Td>
                            <Text fontSize="sm" fontFamily="mono">
                              {report.renter.slice(0, 6)}...
                              {report.renter.slice(-4)}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm" noOfLines={2}>
                              {report.description}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm">
                              {formatDate(report.reportTime)}
                            </Text>
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={
                                report.refundProcessed
                                  ? "green"
                                  : report.isResolved
                                  ? "blue"
                                  : "orange"
                              }
                            >
                              {report.refundProcessed
                                ? "Refunded"
                                : report.isResolved
                                ? "Resolved"
                                : "Pending"}
                            </Badge>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <Button
                                size="sm"
                                colorScheme="blue"
                                variant="outline"
                                onClick={() => openReportDetails(report)}
                                leftIcon={<FaExclamationTriangle />}
                              >
                                Details
                              </Button>
                              {!report.refundProcessed && (
                                <Button
                                  size="sm"
                                  colorScheme="green"
                                  onClick={() =>
                                    handleProcessRefund(report.rentalId)
                                  }
                                  isLoading={
                                    processingRefund === report.rentalId
                                  }
                                  loadingText="Processing..."
                                  leftIcon={<FaMoneyBillWave />}
                                >
                                  Process Refund
                                </Button>
                              )}
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </VStack>
          </Box>
        )}
      </VStack>

      {/* Issue Report Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Issue Report Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedReport && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold">Rental ID:</Text>
                  <Text>#{selectedReport.rentalId}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Cycle:</Text>
                  <Text>{selectedReport.cycleName}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Renter:</Text>
                  <Text fontFamily="mono">{selectedReport.renter}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Issue Description:</Text>
                  <Text>{selectedReport.description}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Reported:</Text>
                  <Text>{formatDate(selectedReport.reportTime)}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Rental Cost:</Text>
                  <Text>{selectedReport.totalCost} ETH</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Status:</Text>
                  <Badge
                    colorScheme={
                      selectedReport.refundProcessed
                        ? "green"
                        : selectedReport.isResolved
                        ? "blue"
                        : "orange"
                    }
                  >
                    {selectedReport.refundProcessed
                      ? "Refunded"
                      : selectedReport.isResolved
                      ? "Resolved"
                      : "Pending"}
                  </Badge>
                </Box>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Close
            </Button>
            {selectedReport && !selectedReport.refundProcessed && (
              <Button
                colorScheme="green"
                onClick={() => {
                  handleProcessRefund(selectedReport.rentalId);
                  onClose();
                }}
                isLoading={processingRefund === selectedReport.rentalId}
                loadingText="Processing..."
                leftIcon={<FaMoneyBillWave />}
              >
                Process Refund
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Admin;
