// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title HeartPillowNFT
/// @notice One NFT per pillow with immutable pillow id tracking.
contract HeartPillowNFT {
    string public name;
    string public symbol;
    address public owner;

    uint256 private _nextTokenId = 1;

    mapping(uint256 => address) private _ownerOf;
    mapping(address => uint256) private _balanceOf;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _isApprovedForAll;

    mapping(uint256 => string) private _tokenUris;
    mapping(uint256 => string) public pillowIdByTokenId;
    mapping(string => uint256) public tokenIdByPillowId;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed spender, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event PillowMinted(uint256 indexed tokenId, string pillowId, address indexed to, string tokenUri);

    error NotOwner();
    error NotTokenOwner();
    error InvalidAddress();
    error NotAuthorized();
    error TokenNotFound();
    error PillowIdAlreadyUsed();
    error InvalidPillowId();

    constructor(string memory name_, string memory symbol_) {
        name = name_;
        symbol = symbol_;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        owner = newOwner;
    }

    function balanceOf(address account) external view returns (uint256) {
        if (account == address(0)) revert InvalidAddress();
        return _balanceOf[account];
    }

    function ownerOf(uint256 tokenId) public view returns (address tokenOwner) {
        tokenOwner = _ownerOf[tokenId];
        if (tokenOwner == address(0)) revert TokenNotFound();
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        ownerOf(tokenId);
        return _tokenApprovals[tokenId];
    }

    function isApprovedForAll(address tokenOwner, address operator) external view returns (bool) {
        return _isApprovedForAll[tokenOwner][operator];
    }

    function approve(address spender, uint256 tokenId) external {
        address tokenOwner = ownerOf(tokenId);
        if (msg.sender != tokenOwner && !_isApprovedForAll[tokenOwner][msg.sender]) revert NotAuthorized();
        _tokenApprovals[tokenId] = spender;
        emit Approval(tokenOwner, spender, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) external {
        _isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        if (to == address(0)) revert InvalidAddress();
        address tokenOwner = ownerOf(tokenId);
        if (tokenOwner != from) revert NotTokenOwner();
        if (
            msg.sender != tokenOwner &&
            msg.sender != _tokenApprovals[tokenId] &&
            !_isApprovedForAll[tokenOwner][msg.sender]
        ) revert NotAuthorized();

        _tokenApprovals[tokenId] = address(0);
        _ownerOf[tokenId] = to;
        unchecked {
            _balanceOf[from] -= 1;
            _balanceOf[to] += 1;
        }
        emit Transfer(from, to, tokenId);
    }

    function mintToOwner(address to, string calldata pillowId, string calldata tokenUri) external onlyOwner returns (uint256 tokenId) {
        if (to == address(0)) revert InvalidAddress();
        if (bytes(pillowId).length == 0) revert InvalidPillowId();
        if (tokenIdByPillowId[pillowId] != 0) revert PillowIdAlreadyUsed();

        tokenId = _nextTokenId++;
        _ownerOf[tokenId] = to;
        _balanceOf[to] += 1;
        _tokenUris[tokenId] = tokenUri;
        pillowIdByTokenId[tokenId] = pillowId;
        tokenIdByPillowId[pillowId] = tokenId;

        emit Transfer(address(0), to, tokenId);
        emit PillowMinted(tokenId, pillowId, to, tokenUri);
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        ownerOf(tokenId);
        return _tokenUris[tokenId];
    }
}

