import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
  Image,
  Divider,
  Grid,
  GridItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
  Icon,
} from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import {
  FaBicycle,
  FaClock,
  FaCoins,
  FaUser,
  FaArrowLeft,
} from "react-icons/fa";

const CycleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contract, account, isConnected } = useWeb3();
  const [cycle, setCycle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [renting, setRenting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [duration, setDuration] = useState(1);

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    if (contract && isConnected && id) {
      loadCycle();
    }
  }, [contract, isConnected, id]);

  const loadCycle = async () => {
    try {
      setLoading(true);
      const cycleData = await contract.getCycle(id);

      setCycle({
        id: cycleData.id.toString(),
        owner: cycleData.owner,
        name: cycleData.name,
        description: cycleData.description,
        imageUrl: cycleData.imageUrl,
        pricePerHour: ethers.formatEther(cycleData.pricePerHour),
        isAvailable: cycleData.isAvailable,
        isActive: cycleData.isActive,
      });
    } catch (error) {
      console.error("Error loading cycle:", error);
      toast.error("Failed to load cycle details");
    } finally {
      setLoading(false);
    }
  };

  const handleRent = async () => {
    try {
      setRenting(true);
      const durationInSeconds = duration * 3600; // Convert hours to seconds
      const totalCost = ethers.parseEther(
        (parseFloat(cycle.pricePerHour) * duration).toFixed(4)
      );

      const tx = await contract.rentCycle(cycle.id, durationInSeconds, {
        value: totalCost,
      });

      toast.promise(tx.wait(), {
        loading: "Processing rental...",
        success: "Cycle rented successfully!",
        error: "Failed to rent cycle",
      });

      await tx.wait();
      onClose();
      navigate("/my-rentals");
    } catch (error) {
      console.error("Error renting cycle:", error);
      toast.error(error.message || "Failed to rent cycle");
    } finally {
      setRenting(false);
    }
  };

  const calculateTotalCost = () => {
    if (!cycle) return "0";
    return (parseFloat(cycle.pricePerHour) * duration).toFixed(4);
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isOwnCycle = cycle?.owner.toLowerCase() === account?.toLowerCase();

  if (!isConnected) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} textAlign="center">
          <Heading>Cycle Details</Heading>
          <Alert status="warning">
            <AlertIcon />
            Please connect your wallet to view cycle details
          </Alert>
        </VStack>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4} py={12}>
          <Spinner size="xl" color="brand.500" />
          <Text>Loading cycle details...</Text>
        </VStack>
      </Container>
    );
  }

  if (!cycle) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} textAlign="center">
          <Heading>Cycle Not Found</Heading>
          <Alert status="error">
            <AlertIcon />
            The cycle you're looking for doesn't exist or has been removed
          </Alert>
          <Button
            onClick={() => navigate("/browse")}
            colorScheme="brand"
            leftIcon={<FaArrowLeft />}
          >
            Back to Browse
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Back Button */}
        <Button
          variant="ghost"
          leftIcon={<FaArrowLeft />}
          onClick={() => navigate("/browse")}
          alignSelf="flex-start"
        >
          Back to Browse
        </Button>

        {/* Cycle Details */}
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={8}>
          {/* Image */}
          <GridItem>
            <Image
              src={
                cycle.imageUrl ||
                "https://via.placeholder.com/600x400?text=Cycle"
              }
              alt={cycle.name}
              borderRadius="lg"
              width="100%"
              height="400px"
              objectFit="cover"
            />
          </GridItem>

          {/* Details */}
          <GridItem>
            <VStack spacing={6} align="stretch">
              <VStack align="stretch" spacing={4}>
                <HStack justify="space-between">
                  <Heading size="lg">{cycle.name}</Heading>
                  <Badge
                    colorScheme={cycle.isAvailable ? "green" : "red"}
                    size="lg"
                  >
                    {cycle.isAvailable ? "Available" : "Rented"}
                  </Badge>
                </HStack>

                <Text color="gray.600" fontSize="lg">
                  {cycle.description}
                </Text>

                <Divider />

                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <HStack>
                      <FaCoins color="#3182CE" />
                      <Text fontWeight="semibold">Price per Hour:</Text>
                    </HStack>
                    <Text fontSize="lg" fontWeight="bold" color="brand.500">
                      {cycle.pricePerHour} ETH
                    </Text>
                  </HStack>

                  <HStack justify="space-between">
                    <HStack>
                      <FaUser color="#3182CE" />
                      <Text fontWeight="semibold">Owner:</Text>
                    </HStack>
                    <Text>{formatAddress(cycle.owner)}</Text>
                  </HStack>

                  <HStack justify="space-between">
                    <HStack>
                      <FaBicycle color="#3182CE" />
                      <Text fontWeight="semibold">Status:</Text>
                    </HStack>
                    <Text>{cycle.isActive ? "Active" : "Inactive"}</Text>
                  </HStack>
                </VStack>

                <Divider />

                {isOwnCycle ? (
                  <Alert status="info">
                    <AlertIcon />
                    This is your cycle. You cannot rent your own cycle.
                  </Alert>
                ) : cycle.isAvailable ? (
                  <Button
                    size="lg"
                    colorScheme="brand"
                    leftIcon={<FaClock />}
                    onClick={onOpen}
                  >
                    Rent This Cycle
                  </Button>
                ) : (
                  <Alert status="warning">
                    <AlertIcon />
                    This cycle is currently rented and not available.
                  </Alert>
                )}
              </VStack>
            </VStack>
          </GridItem>
        </Grid>
      </VStack>

      {/* Rental Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Rent {cycle?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Box textAlign="center">
                <Image
                  src={
                    cycle?.imageUrl ||
                    "https://via.placeholder.com/200x150?text=Cycle"
                  }
                  alt={cycle?.name}
                  borderRadius="md"
                  mb={4}
                />
                <Text fontSize="lg" fontWeight="bold">
                  {cycle?.name}
                </Text>
                <Text color="gray.600">{cycle?.description}</Text>
              </Box>

              <FormControl>
                <FormLabel>Rental Duration (hours)</FormLabel>
                <NumberInput
                  value={duration}
                  onChange={(value) => setDuration(parseInt(value) || 1)}
                  min={1}
                  max={24}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <Box bg="gray.50" p={4} borderRadius="md" width="100%">
                <VStack spacing={2}>
                  <HStack justify="space-between" width="100%">
                    <Text>Price per hour:</Text>
                    <Text fontWeight="semibold">{cycle?.pricePerHour} ETH</Text>
                  </HStack>
                  <HStack justify="space-between" width="100%">
                    <Text>Duration:</Text>
                    <Text fontWeight="semibold">{duration} hours</Text>
                  </HStack>
                  <HStack
                    justify="space-between"
                    width="100%"
                    borderTop="1px"
                    borderColor="gray.200"
                    pt={2}
                  >
                    <Text fontWeight="bold">Total Cost:</Text>
                    <Text fontWeight="bold" color="brand.500">
                      {calculateTotalCost()} ETH
                    </Text>
                  </HStack>
                </VStack>
              </Box>

              <Alert status="info">
                <AlertIcon />
                <Text fontSize="sm">
                  You can rent for 1-24 hours. Payment will be processed
                  immediately.
                </Text>
              </Alert>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleRent}
              isLoading={renting}
              loadingText="Processing..."
              leftIcon={<FaClock />}
            >
              Confirm Rental
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default CycleDetail;
