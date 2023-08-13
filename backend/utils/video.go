package utils

func CalculateChunkRange(size int64, offset int64, chunkSize int64) (int64, error) {

	return offset + chunkSize, nil
}
