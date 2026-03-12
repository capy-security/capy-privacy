#!/bin/bash
# Generate Go protobuf code from dnsmessage.proto

mkdir -p pb
protoc --go_out=pb --go_opt=paths=source_relative --go_opt=Mdnsmessage.proto=capy-metrics/pb dnsmessage.proto

