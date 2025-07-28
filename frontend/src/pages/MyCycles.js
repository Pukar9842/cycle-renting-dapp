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
  Image,
} from "@chakra-ui/react";
import { useWeb3 } from "../context/Web3Context";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { FaBicycle, FaEdit, FaTrash, FaCoins } from "react-icons/fa";

const MyCycles = () => {
  const { contract, account, isConnected } = useWeb3();
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingCycle, setUpdatingCycle] = useState(null);
  const [removingCycle, setRemovingCycle] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [newPrice, setNewPrice] = useState("");

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    if (contract && isConnected && account) {
      loadCycles();
    }
  }, [contract, isConnected, account]);

  const loadCycles = async () => {
    try {
      setLoading(true);
      const cycleIds = await contract.getOwnerCycles(account);
      const cyclesData = [];

      for (const cycleId of cycleIds) {
        const cycle = await contract.getCycle(cycleId);
        cyclesData.push({
          id: cycle.id.toString(),
          name: cycle.name,
          description: cycle.description,
          imageUrl: cycle.imageUrl,
          pricePerHour: ethers.formatEther(cycle.pricePerHour),
          isAvailable: cycle.isAvailable,
          isActive: cycle.isActive,
        });
      }

      setCycles(cyclesData);
    } catch (error) {
      console.error("Error loading cycles:", error);
      toast.error("Failed to load cycles");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!newPrice || parseFloat(newPrice) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    try {
      setUpdatingCycle(selectedCycle.id);
      const priceInWei = ethers.parseEther(newPrice);

      const tx = await contract.updateCyclePrice(selectedCycle.id, priceInWei);

      toast.promise(tx.wait(), {
        loading: "Updating price...",
        success: "Price updated successfully!",
        error: "Failed to update price",
      });

      await tx.wait();
      loadCycles();
      onClose();
    } catch (error) {
      console.error("Error updating price:", error);
      toast.error(error.message || "Failed to update price");
    } finally {
      setUpdatingCycle(null);
    }
  };

  const handleRemoveCycle = async (cycleId) => {
    try {
      setRemovingCycle(cycleId);
      const tx = await contract.removeCycle(cycleId);

      toast.promise(tx.wait(), {
        loading: "Removing cycle...",
        success: "Cycle removed successfully!",
        error: "Failed to remove cycle",
      });

      await tx.wait();
      loadCycles();
    } catch (error) {
      console.error("Error removing cycle:", error);
      toast.error(error.message || "Failed to remove cycle");
    } finally {
      setRemovingCycle(null);
    }
  };

  const openUpdateModal = (cycle) => {
    setSelectedCycle(cycle);
    setNewPrice(cycle.pricePerHour);
    onOpen();
  };

  if (!isConnected) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} textAlign="center">
          <Heading>My Cycles</Heading>
          <Alert status="warning">
            <AlertIcon />
            Please connect your wallet to view your cycles
          </Alert>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <VStack spacing={4} textAlign="center">
          <Heading>My Cycles</Heading>
          <Text color="gray.600">
            Manage your listed cycles and track their status
          </Text>
        </VStack>

        {loading ? (
          <VStack spacing={4} py={12}>
            <Spinner size="xl" color="brand.500" />
            <Text>Loading your cycles...</Text>
          </VStack>
        ) : cycles.length === 0 ? (
          <VStack spacing={4} py={12}>
            <Text fontSize="lg" color="gray.600">
              You haven't listed any cycles yet
            </Text>
            <Button
              as="a"
              href="/list-cycle"
              colorScheme="brand"
              leftIcon={<FaBicycle />}
            >
              List Your First Cycle
            </Button>
          </VStack>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {cycles.map((cycle) => (
              <Box
                key={cycle.id}
                bg={bg}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                overflow="hidden"
                shadow="md"
              >
                <Image
                  src={
                    cycle.imageUrl ||
                    "https://via.placeholder.com/300x200?text=Cycle"
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
                      <Badge colorScheme={cycle.isAvailable ? "green" : "red"}>
                        {cycle.isAvailable ? "Available" : "Rented"}
                      </Badge>
                    </HStack>

                    <Text color="gray.600" noOfLines={2}>
                      {cycle.description}
                    </Text>

                    <HStack justify="space-between">
                      <HStack>
                        <FaCoins color="#3182CE" />
                        <Text fontWeight="semibold">
                          {cycle.pricePerHour} ETH/hour
                        </Text>
                      </HStack>
                    </HStack>

                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="brand"
                        leftIcon={<FaEdit />}
                        onClick={() => openUpdateModal(cycle)}
                        flex={1}
                      >
                        Update Price
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="red"
                        leftIcon={<FaTrash />}
                        onClick={() => handleRemoveCycle(cycle.id)}
                        isLoading={removingCycle === cycle.id}
                        loadingText="Removing..."
                        flex={1}
                        isDisabled={!cycle.isAvailable}
                      >
                        Remove
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </VStack>

      {/* Update Price Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Update Cycle Price</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              {selectedCycle && (
                <Box textAlign="center">
                  <Image
                    src={
                      selectedCycle.imageUrl ||
                      "https://via.placeholder.com/200x150?text=Cycle"
                    }
                    alt={selectedCycle.name}
                    borderRadius="md"
                    mb={4}
                  />
                  <Text fontSize="lg" fontWeight="bold">
                    {selectedCycle.name}
                  </Text>
                </Box>
              )}

              <FormControl>
                <FormLabel>New Price per Hour (ETH)</FormLabel>
                <NumberInput
                  value={newPrice}
                  onChange={(value) => setNewPrice(value)}
                  min={0.001}
                  max={10}
                  precision={4}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleUpdatePrice}
              isLoading={updatingCycle === selectedCycle?.id}
              loadingText="Updating..."
            >
              Update Price
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default MyCycles;
