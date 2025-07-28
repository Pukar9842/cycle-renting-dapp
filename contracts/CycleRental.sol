// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CycleRental is ReentrancyGuard, Ownable {
    uint256 private _cycleIds;
    uint256 private _rentalIds;
    
    constructor() Ownable(msg.sender) {}
    
    struct Cycle {
        uint256 id;
        address owner;
        string name;
        string description;
        string imageUrl;
        uint256 pricePerHour;
        bool isAvailable;
        bool isActive;
    }
    
    struct Rental {
        uint256 id;
        uint256 cycleId;
        address renter;
        uint256 startTime;
        uint256 endTime;
        uint256 totalCost;
        bool isActive;
        bool isReturned;
        bool hasIssueReported;
    }
    
    struct IssueReport {
        uint256 rentalId;
        address reporter;
        string description;
        uint256 reportTime;
        bool isResolved;
        bool refundProcessed;
    }
    
    mapping(uint256 => Cycle) public cycles;
    mapping(uint256 => Rental) public rentals;
    mapping(uint256 => IssueReport) public issueReports;
    mapping(address => uint256[]) public userRentals;
    mapping(address => uint256[]) public ownerCycles;
    
    uint256 public platformFee = 5; // 5% platform fee
    uint256 public minRentalDuration = 1 hours;
    uint256 public maxRentalDuration = 24 hours;
    
    event CycleListed(uint256 indexed cycleId, address indexed owner, string name, uint256 pricePerHour);
    event CycleRented(uint256 indexed rentalId, uint256 indexed cycleId, address indexed renter, uint256 startTime, uint256 endTime);
    event CycleReturned(uint256 indexed rentalId, uint256 indexed cycleId, address indexed renter);
    event CycleRemoved(uint256 indexed cycleId, address indexed owner);
    event IssueReported(uint256 indexed rentalId, address indexed reporter, string description);
    event RefundProcessed(uint256 indexed rentalId, address indexed renter, uint256 amount);
    
    modifier cycleExists(uint256 _cycleId) {
        require(cycles[_cycleId].id != 0, "Cycle does not exist");
        _;
    }
    
    modifier cycleAvailable(uint256 _cycleId) {
        require(cycles[_cycleId].isAvailable, "Cycle is not available");
        require(cycles[_cycleId].isActive, "Cycle is not active");
        _;
    }
    
    modifier rentalExists(uint256 _rentalId) {
        require(rentals[_rentalId].id != 0, "Rental does not exist");
        _;
    }
    
    modifier onlyCycleOwner(uint256 _cycleId) {
        require(cycles[_cycleId].owner == msg.sender, "Not the cycle owner");
        _;
    }
    
    modifier onlyRenter(uint256 _rentalId) {
        require(rentals[_rentalId].renter == msg.sender, "Not the renter");
        _;
    }
    
    function listCycle(
        string memory _name,
        string memory _description,
        string memory _imageUrl,
        uint256 _pricePerHour
    ) external {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_pricePerHour > 0, "Price must be greater than 0");
        
        _cycleIds++;
        uint256 newCycleId = _cycleIds;
        
        cycles[newCycleId] = Cycle({
            id: newCycleId,
            owner: msg.sender,
            name: _name,
            description: _description,
            imageUrl: _imageUrl,
            pricePerHour: _pricePerHour,
            isAvailable: true,
            isActive: true
        });
        
        ownerCycles[msg.sender].push(newCycleId);
        
        emit CycleListed(newCycleId, msg.sender, _name, _pricePerHour);
    }
    
    function rentCycle(uint256 _cycleId, uint256 _duration) 
        external 
        payable 
        nonReentrant 
        cycleExists(_cycleId) 
        cycleAvailable(_cycleId) 
    {
        require(_duration >= minRentalDuration, "Rental duration too short");
        require(_duration <= maxRentalDuration, "Rental duration too long");
        require(msg.sender != cycles[_cycleId].owner, "Cannot rent your own cycle");
        
        uint256 totalCost = cycles[_cycleId].pricePerHour * _duration / 1 hours;
        require(msg.value >= totalCost, "Insufficient payment");
        
        _rentalIds++;
        uint256 newRentalId = _rentalIds;
        
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + _duration;
        
        rentals[newRentalId] = Rental({
            id: newRentalId,
            cycleId: _cycleId,
            renter: msg.sender,
            startTime: startTime,
            endTime: endTime,
            totalCost: totalCost,
            isActive: true,
            isReturned: false,
            hasIssueReported: false
        });
        
        cycles[_cycleId].isAvailable = false;
        userRentals[msg.sender].push(newRentalId);
        
        // Transfer payment to cycle owner (minus platform fee)
        uint256 platformFeeAmount = (totalCost * platformFee) / 100;
        uint256 ownerAmount = totalCost - platformFeeAmount;
        
        payable(cycles[_cycleId].owner).transfer(ownerAmount);
        
        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
        
        emit CycleRented(newRentalId, _cycleId, msg.sender, startTime, endTime);
    }
    
    function reportIssue(uint256 _rentalId, string memory _description) 
        external 
        nonReentrant 
        rentalExists(_rentalId) 
        onlyRenter(_rentalId) 
    {
        Rental storage rental = rentals[_rentalId];
        require(rental.isActive, "Rental is not active");
        require(!rental.hasIssueReported, "Issue already reported for this rental");
        require(bytes(_description).length > 0, "Description cannot be empty");
        
        rental.hasIssueReported = true;
        
        issueReports[_rentalId] = IssueReport({
            rentalId: _rentalId,
            reporter: msg.sender,
            description: _description,
            reportTime: block.timestamp,
            isResolved: false,
            refundProcessed: false
        });
        
        emit IssueReported(_rentalId, msg.sender, _description);
    }
    
    function processRefund(uint256 _rentalId) 
        external 
        onlyOwner 
        rentalExists(_rentalId) 
    {
        Rental storage rental = rentals[_rentalId];
        IssueReport storage report = issueReports[_rentalId];
        
        require(rental.hasIssueReported, "No issue reported for this rental");
        require(!report.refundProcessed, "Refund already processed");
        
        report.refundProcessed = true;
        report.isResolved = true;
        
        // Calculate refund amount (full amount minus platform fee)
        uint256 refundAmount = rental.totalCost;
        
        // Transfer refund to renter
        payable(rental.renter).transfer(refundAmount);
        
        // Make cycle available again
        cycles[rental.cycleId].isAvailable = true;
        
        emit RefundProcessed(_rentalId, rental.renter, refundAmount);
    }
    
    function returnCycle(uint256 _rentalId) 
        external 
        nonReentrant 
        rentalExists(_rentalId) 
    {
        Rental storage rental = rentals[_rentalId];
        require(rental.renter == msg.sender, "Not the renter");
        require(rental.isActive, "Rental is not active");
        require(block.timestamp >= rental.endTime, "Rental period not ended");
        
        rental.isActive = false;
        rental.isReturned = true;
        cycles[rental.cycleId].isAvailable = true;
        
        emit CycleReturned(_rentalId, rental.cycleId, msg.sender);
    }
    
    function removeCycle(uint256 _cycleId) 
        external 
        cycleExists(_cycleId) 
        onlyCycleOwner(_cycleId) 
    {
        require(cycles[_cycleId].isAvailable, "Cannot remove rented cycle");
        
        cycles[_cycleId].isActive = false;
        cycles[_cycleId].isAvailable = false;
        
        emit CycleRemoved(_cycleId, msg.sender);
    }
    
    function updateCyclePrice(uint256 _cycleId, uint256 _newPrice) 
        external 
        cycleExists(_cycleId) 
        onlyCycleOwner(_cycleId) 
    {
        require(_newPrice > 0, "Price must be greater than 0");
        cycles[_cycleId].pricePerHour = _newPrice;
    }
    
    function getCycle(uint256 _cycleId) external view returns (Cycle memory) {
        return cycles[_cycleId];
    }
    
    function getRental(uint256 _rentalId) external view returns (Rental memory) {
        return rentals[_rentalId];
    }
    
    function getIssueReport(uint256 _rentalId) external view returns (IssueReport memory) {
        return issueReports[_rentalId];
    }
    
    function getUserRentals(address _user) external view returns (uint256[] memory) {
        return userRentals[_user];
    }
    
    function getOwnerCycles(address _owner) external view returns (uint256[] memory) {
        return ownerCycles[_owner];
    }
    
    function getAllAvailableCycles() external view returns (uint256[] memory) {
        uint256[] memory availableCycles = new uint256[](_cycleIds);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= _cycleIds; i++) {
            if (cycles[i].isAvailable && cycles[i].isActive) {
                availableCycles[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        assembly {
            mstore(availableCycles, count)
        }
        
        return availableCycles;
    }
    
    function getTotalCycles() external view returns (uint256) {
        return _cycleIds;
    }
    
    function getTotalRentals() external view returns (uint256) {
        return _rentalIds;
    }
    
    // Admin functions
    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 20, "Fee cannot exceed 20%");
        platformFee = _newFee;
    }
    
    function setMinRentalDuration(uint256 _duration) external onlyOwner {
        minRentalDuration = _duration;
    }
    
    function setMaxRentalDuration(uint256 _duration) external onlyOwner {
        maxRentalDuration = _duration;
    }
    
    function withdrawPlatformFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
} 