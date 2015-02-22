import pylab
import numpy as np
import scipy as sp
import matplotlib as mp

#from pylab import*
#from scipy.io import wavfile

def tonefreq(q = []):
    q = q**2
    
    if n % 2 > 0: # we've got odd number of points fft
        q[1:len(q)] = q[1:len(q)] * 2
    else:
        q[1:len(q) -1] = q[1:len(q) - 1] * 2 # we've got even number of points fft
    
    freqArray = np.arange(0, nUniquePts, 1.0) * (sampFreq / n);
    #print(freqArray)
    #pylab.plot(freqArray, 10*np.log10(q), color='k')
    #pylab.xlabel('Frequency (Hz)')
    #pylab.ylabel('Power (dB)')
    
    a = list(range(49))
    for i in range(49):
        a[i] = 440 * pow(2, (i+16 - 49)/12)
    
    pairs = zip(q, freqArray)
    pairs = [list(e) for e in pairs]
    newpairs = []
    for m in range(len(pairs)):
        if pairs[m][1] > 63 and pairs[m][1] < 1070:
            newpairs += [pairs[m]]
    newpairs.sort(key=lambda tup: tup[0])
    
    newpairs.reverse()
    
    b = list(range(49))

    for j in newpairs:
        for k in range(49):
            b[k] = abs(a[k] - j[1])
        j[1] = a[np.argmin(b)]
    
    #print (newpairs)
    return(newpairs[0][1])

#def sendnote(oldstate, state, hold):

pylab.show()
sampFreq, snd = wavfile.read('sin.wav')

#print (len(snd))
#for x in range (0, len(snd)):
#   print (snd)

snd = snd / (2 ** 15)

length = snd.shape[0]

s1 = snd[:]
#s1 = snd
timeArray = np.arange(0, length, 1)
timeArray = timeArray / sampFreq
timeArray = timeArray * 1000

n = len(s1)
p = sp.fft(s1)

nUniquePts = np.ceil((n+1)/2.0)
p = p[0:nUniquePts]
p = abs(p)
p = p / float(n)

oldstate = "out"
state = "out"
hold = "off"
threshold = (max(s1)**2)/10
prev = 0
inc = 1
count = 1

for a in range(10):
    segment = s1[a*len(s1)/10:(a+1)*len(s1)/10]**2
    l = len(segment)
    begspl = np.mean(segment[0:l/5])
    midspl = np.mean(segment[l/5:4*l/5])
    endspl = np.mean(segment[4*l/5:l])
    oldstate = state
    if midspl < threshold:
        count = inc
        inc = 1
        state = "rest"
        hold = "off"
    else:
        tone = tonefreq(p)
        if endspl < threshold:
            count = inc
            inc = 1
            state = "out"
            hold = "off"
        else:
            state = "in"
            if begspl > threshold and oldstate == "in" and tone == prev:
                hold = "on"
                count = 1
                inc += 1
            else:
                count = inc
                inc = 1
                hold = "off"
        print(tone)    
        prev = tone
    #sendnote(state, tone, prev, count)
        #if count > 1:
            #create note with tone equal to prev and lenth equal to count
        #if state == "rest":
            #create rest with length equal to len(segment)
        #elif count == 1:
            #create note with tone equal to tone and length equal to len(segment)
