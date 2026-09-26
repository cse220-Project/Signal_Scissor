/* Minimal file wrapper for the user-supplied PyAutoTune/Autotalent engine.
 * Input/output are mono little-endian float32 PCM files: cli in.raw out.raw fs
 */
#include <stdio.h>
#include <stdlib.h>
#include "../PyAutotune/autotalent.h"

int main(int argc, char **argv) {
    FILE *input, *output;
    long bytes, samples;
    float *buffer;
    unsigned long fs;
    float concert_a = 440.0f, fixed_pitch = 0.0f, fixed_pull = 0.0f;
    float correction = 1.0f, smoothing = 0.0f, shift = 0.0f;
    float lfo_depth = 0.0f, lfo_rate = 1.0f, lfo_shape = 0.0f, lfo_symmetry = 0.0f;
    float formant_warp = 0.0f, mix = 1.0f;
    int scale_rotate = 0, lfo_quantized = 0, formant_correct = 0;
    char key = 'c';

    if (argc != 4 || (fs = (unsigned long)strtoul(argv[3], NULL, 10)) < 4000) return 2;
    input = fopen(argv[1], "rb");
    if (!input) return 3;
    fseek(input, 0, SEEK_END); bytes = ftell(input); rewind(input);
    if (bytes <= 0 || bytes % (long)sizeof(float)) { fclose(input); return 4; }
    samples = bytes / (long)sizeof(float);
    buffer = (float *)malloc((size_t)bytes);
    if (!buffer || fread(buffer, sizeof(float), (size_t)samples, input) != (size_t)samples) { fclose(input); free(buffer); return 5; }
    fclose(input);

    instantiateAutotalentInstance(fs);
    initializeAutotalent(&concert_a, &key, &fixed_pitch, &fixed_pull, &correction,
        &smoothing, &shift, &scale_rotate, &lfo_depth, &lfo_rate, &lfo_shape,
        &lfo_symmetry, &lfo_quantized, &formant_correct, &formant_warp, &mix);
    processSamples(buffer, (int)samples);
    freeAutotalentInstance();

    output = fopen(argv[2], "wb");
    if (!output || fwrite(buffer, sizeof(float), (size_t)samples, output) != (size_t)samples) { if (output) fclose(output); free(buffer); return 6; }
    fclose(output); free(buffer); return 0;
}
