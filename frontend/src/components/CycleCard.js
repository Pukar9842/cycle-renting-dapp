import React, { useState } from "react";
import {
  Box,
  Image,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  useColorModeValue,
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
  Alert,
  AlertIcon,
  Spinner,
} from "@chakra-ui/react";
import { useWeb3 } from "../context/Web3Context";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { FaBicycle, FaClock, FaCoins } from "react-icons/fa";

const CycleCard = ({ cycle, onRent }) => {
  const { contract, account } = useWeb3();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [duration, setDuration] = useState(1);
  const [loading, setLoading] = useState(false);

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const calculateTotalCost = () => {
    return (parseFloat(cycle.pricePerHour) * duration).toFixed(4);
  };

  const handleRent = async () => {
    try {
      setLoading(true);
      const durationInSeconds = duration * 3600; // Convert hours to seconds
      const totalCost = ethers.parseEther(calculateTotalCost());

      const tx = await contract.rentCycle(cycle.id, durationInSeconds, {
        value: totalCost,
      });

      toast.promise(tx.wait(), {
        loading: "Processing rental...",
        success: "Cycle rented successfully!",
        error: "Failed to rent cycle",
      });

      await tx.wait();
      onRent();
      onClose();
    } catch (error) {
      console.error("Error renting cycle:", error);
      toast.error(error.message || "Failed to rent cycle");
    } finally {
      setLoading(false);
    }
  };

  const isOwnCycle = cycle.owner.toLowerCase() === account?.toLowerCase();

  return (
    <>
      <Box
        bg={bg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        overflow="hidden"
        shadow="md"
        _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
        transition="all 0.2s"
      >
        <Image
          src={
            cycle.imageUrl || "https://via.placeholder.com/300x200?text=Cycle"
          }
          alt={cycle.name}
          height="200px"
          width="100%"
          objectFit="cover"
        />

        <Box p={6}>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="xl" fontWeight="bold" noOfLines={1}>
                {cycle.name}
              </Text>
              <Badge colorScheme="green">Available</Badge>
            </HStack>

            <Text color="gray.600" noOfLines={2}>
              {cycle.description}
            </Text>

            <HStack justify="space-between">
              <HStack>
                <FaCoins color="#3182CE" />
                <Text fontWeight="semibold">{cycle.pricePerHour} ETH/hour</Text>
              </HStack>
            </HStack>

            <Button
              leftIcon={<FaBicycle />}
              colorScheme="brand"
              onClick={onOpen}
              isDisabled={isOwnCycle}
            >
              {isOwnCycle ? "Your Cycle" : "Rent Now"}
            </Button>
          </VStack>
        </Box>
      </Box>

      {/* Rental Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Rent Cycle</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Box textAlign="center">
                <Image
                  src={
                    cycle.imageUrl ||
                    "https://via.placeholder.com/200x150?text=Cycle"
                  }
                  alt={cycle.name}
                  borderRadius="md"
                  mb={4}
                />
                <Text fontSize="lg" fontWeight="bold">
                  {cycle.name}
                </Text>
                <Text color="gray.600">{cycle.description}</Text>
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
                    <Text fontWeight="semibold">{cycle.pricePerHour} ETH</Text>
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
              isLoading={loading}
              loadingText="Processing..."
              leftIcon={<FaClock />}
            >
              Confirm Rental
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CycleCard;
