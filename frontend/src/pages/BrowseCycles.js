import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Input,
  Select,
  HStack,
  VStack,
  Button,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
} from "@chakra-ui/react";
import { useWeb3 } from "../context/Web3Context";
import CycleCard from "../components/CycleCard";
import { ethers } from "ethers";

const BrowseCycles = () => {
  const { contract, isConnected } = useWeb3();
  const [cycles, setCycles] = useState([]);
  const [filteredCycles, setFilteredCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const bg = useColorModeValue("white", "gray.800");

  useEffect(() => {
    if (contract && isConnected) {
      loadCycles();
    }
  }, [contract, isConnected]);

  useEffect(() => {
    filterAndSortCycles();
  }, [cycles, searchTerm, sortBy]);

  const loadCycles = async () => {
    try {
      setLoading(true);
      const availableCycleIds = await contract.getAllAvailableCycles();
      const cyclesData = [];

      for (const cycleId of availableCycleIds) {
        const cycle = await contract.getCycle(cycleId);
        cyclesData.push({
          id: cycle.id.toString(),
          owner: cycle.owner,
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
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCycles = () => {
    let filtered = cycles.filter(
      (cycle) =>
        cycle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cycle.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort cycles
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-low":
          return parseFloat(a.pricePerHour) - parseFloat(b.pricePerHour);
        case "price-high":
          return parseFloat(b.pricePerHour) - parseFloat(a.pricePerHour);
        default:
          return 0;
      }
    });

    setFilteredCycles(filtered);
  };

  if (!isConnected) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} textAlign="center">
          <Heading>Browse Available Cycles</Heading>
          <Alert status="warning">
            <AlertIcon />
            Please connect your wallet to browse cycles
          </Alert>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <VStack spacing={4} textAlign="center">
          <Heading>Browse Available Cycles</Heading>
          <Text color="gray.600">
            Find the perfect cycle for your next adventure
          </Text>
        </VStack>

        {/* Search and Filter */}
        <Box bg={bg} p={6} rounded="lg" shadow="md">
          <HStack spacing={4} wrap="wrap">
            <Input
              placeholder="Search cycles by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              maxW="400px"
            />
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              maxW="200px"
            >
              <option value="name">Sort by Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </Select>
            <Badge colorScheme="blue" p={2} rounded="md">
              {filteredCycles.length} cycles available
            </Badge>
          </HStack>
        </Box>

        {/* Cycles Grid */}
        {loading ? (
          <VStack spacing={4} py={12}>
            <Spinner size="xl" color="brand.500" />
            <Text>Loading cycles...</Text>
          </VStack>
        ) : filteredCycles.length === 0 ? (
          <VStack spacing={4} py={12}>
            <Text fontSize="lg" color="gray.600">
              {searchTerm
                ? "No cycles found matching your search."
                : "No cycles available at the moment."}
            </Text>
            {searchTerm && (
              <Button
                onClick={() => setSearchTerm("")}
                variant="outline"
                colorScheme="brand"
              >
                Clear Search
              </Button>
            )}
          </VStack>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {filteredCycles.map((cycle) => (
              <CycleCard key={cycle.id} cycle={cycle} onRent={loadCycles} />
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </Container>
  );
};

export default BrowseCycles;
