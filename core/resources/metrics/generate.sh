#!/bin/bash
# Generate Go protobuf code from dnsmessage.proto

mkdir -p pb
protoc --go_out=pb --go_opt=paths=source_relative --go_opt=Mdnsmessage.proto=capy-security-metrics/pb dnsmessage.proto

